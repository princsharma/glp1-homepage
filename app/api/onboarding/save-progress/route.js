// app/api/onboarding/save-progress/route.js
//
// Called by the onboarding form after the user advances past any screen
// beyond email capture. The client passes its Firebase ID token in the
// Authorization header; we verify it, then merge the latest form snapshot
// into users/{uid}.
//
// Why a server route (vs writing directly from the client to Firestore via
// the web SDK)?
//   - Single source of truth for field whitelisting / projection
//   - Hides the Firestore schema from the client (we can change it freely)
//   - Lets us add server-side validation, logging, downstream side-effects
//     (CRM sync, analytics, etc.) without touching the client
//
// Request body:
//   { form: { ...full form state... }, currentStep: "s21", status?: "onboarded" }
//
// Response:
//   { success: true }

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import {
  projectFormToUserFields,
  upsertUser,
} from "@/services/firebase/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function verifyAuth(request) {
  const header = request.headers.get("authorization") || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!idToken) return null;
  try {
    return await adminAuth.verifyIdToken(idToken);
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const decoded = await verifyAuth(request);
    if (!decoded?.uid) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const form = body.form && typeof body.form === "object" ? body.form : {};
    const currentStep =
      typeof body.currentStep === "string" ? body.currentStep : undefined;
    const status = body.status === "onboarded" ? "onboarded" : undefined;

    // eslint-disable-next-line no-console
    console.log(
      `\n[save-progress] received from uid=${decoded.uid} (screen=${currentStep}${status ? `, status=${status}` : ""})`,
    );
    // eslint-disable-next-line no-console
    console.log("[save-progress] raw form fields:", form);

    const projected = projectFormToUserFields(form);
    const writePayload = {
      ...projected,
      ...(currentStep ? { currentStep } : {}),
      ...(status ? { status } : {}),
      ...(form.consentH !== undefined ? { consentHIPAA: !!form.consentH } : {}),
      ...(form.consentT !== undefined ? { consentTelehealth: !!form.consentT } : {}),
      // Mirror the email_verified claim from the verified ID token so the
      // dashboard can react without a fresh Auth round-trip. The token is
      // server-verified above, so this value is trustworthy.
      emailVerified: !!decoded.email_verified,
    };

    // eslint-disable-next-line no-console
    console.log("[save-progress] writing to Firestore users/" + decoded.uid + ":", {
      topLevel: Object.fromEntries(
        Object.entries(writePayload).filter(([k]) => k !== "formSnapshot"),
      ),
      onboardingNested: writePayload.formSnapshot || {},
    });

    const result = await upsertUser(decoded.uid, writePayload);

    // eslint-disable-next-line no-console
    console.log(
      `[save-progress] ${result.created ? "CREATED new" : "UPDATED existing"} users/${decoded.uid}\n`,
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[save-progress] error:", err);
    return NextResponse.json(
      { success: false, message: "Could not save your progress." },
      { status: 500 },
    );
  }
}
