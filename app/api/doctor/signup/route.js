// app/api/doctor/signup/route.js
//
// Called by the doctor registration page after the client creates a Firebase
// Auth account and (optionally) uploads a headshot. We verify the ID token,
// then write users/{uid} with role="doctor", profile/clinical metadata, and
// seed availability/{uid} with the captured weekly schedule so patients can
// start booking immediately.
//
// Request body:
//   {
//     firstName, lastName, phone, bio,
//     licenses: [{ state, licenseNumber, licenseType }, ...],
//     photoURL: string,
//     prescriptionTemplate: string,
//     signatureDataUrl: string  (PNG data URL — typically <30KB),
//     banking: { accountHolder, bankName, accountType, routingNumber, accountNumber },
//     availability: { slotDurationMinutes, weeklySchedule: { day -> [{start,end}] } }
//   }
//
// Banking note: storing raw routing+account numbers in Firestore is a
// production red flag. For a real deployment, route this through Stripe
// Connect (or equivalent) and persist only a token + last4 here. We keep the
// raw values because this is what the form captures; the safe thing to do
// before going live is replace this with a token exchange.

import { upsertUser } from "@/services/firebase/users";
import { setAvailability } from "@/services/firebase/availability";
import { fail, ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeLicenses(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((l) => ({
      state: typeof l?.state === "string" ? l.state.trim().toUpperCase() : "",
      licenseNumber:
        typeof l?.licenseNumber === "string" ? l.licenseNumber.trim() : "",
      licenseType:
        typeof l?.licenseType === "string" ? l.licenseType.trim() : "",
    }))
    .filter((l) => l.state && l.licenseNumber);
}

function sanitizeBanking(input) {
  if (!input || typeof input !== "object") return null;
  const routing = String(input.routingNumber || "").replace(/\D/g, "");
  const account = String(input.accountNumber || "").replace(/\D/g, "");
  if (!/^\d{9}$/.test(routing)) return null;
  if (!/^\d{4,17}$/.test(account)) return null;
  const accountType = input.accountType === "savings" ? "savings" : "checking";
  return {
    accountHolder: String(input.accountHolder || "").trim(),
    bankName: String(input.bankName || "").trim(),
    accountType,
    routingNumber: routing,
    accountNumber: account,
    accountNumberLast4: account.slice(-4),
  };
}

// withAuth (no role) — the user has a Firebase Auth account but no
// Firestore user doc yet; this endpoint is what creates it with role=doctor.
export const POST = withAuth(async (request, _ctx, { decoded }) => {
  const body = await request.json().catch(() => ({}));
  const firstName =
    typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName =
    typeof body.lastName === "string" ? body.lastName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";
  const licenses = sanitizeLicenses(body.licenses);
  const photoURL =
    typeof body.photoURL === "string" && body.photoURL.startsWith("http")
      ? body.photoURL
      : "";
  const prescriptionTemplate =
    typeof body.prescriptionTemplate === "string"
      ? body.prescriptionTemplate.trim().slice(0, 4000)
      : "";
  const signatureDataUrl =
    typeof body.signatureDataUrl === "string" &&
    body.signatureDataUrl.startsWith("data:image/")
      ? body.signatureDataUrl
      : "";
  const banking = sanitizeBanking(body.banking);

  if (!firstName || !lastName) return fail("Name is required.", 400);
  if (licenses.length === 0) return fail("At least one license is required.", 400);
  if (!banking) return fail("Valid US banking details are required.", 400);
  if (prescriptionTemplate.length < 30) {
    return fail("Prescription template is too short.", 400);
  }

  await upsertUser(decoded.uid, {
    role: "doctor",
    status: "active",
    email: decoded.email || "",
    firstName,
    lastName,
    phone,
    bio,
    licenses,
    photoURL,
    doctorProfile: {
      prescriptionTemplate,
      signatureDataUrl,
    },
    banking,
    emailVerified: !!decoded.email_verified,
  });

  // Seed availability/{uid} with whatever the doctor picked in the form.
  // Non-fatal — the dashboard can rebuild this from defaults if it fails.
  if (body.availability && typeof body.availability === "object") {
    try {
      await setAvailability(decoded.uid, body.availability);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[doctor/signup] availability seed failed:", err);
    }
  }

  return ok();
});
