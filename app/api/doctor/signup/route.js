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

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { upsertUser } from "@/services/firebase/users";
import { setAvailability } from "@/services/firebase/availability";

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

    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: "Name is required." },
        { status: 400 },
      );
    }
    if (licenses.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one license is required." },
        { status: 400 },
      );
    }
    if (!banking) {
      return NextResponse.json(
        { success: false, message: "Valid US banking details are required." },
        { status: 400 },
      );
    }
    if (prescriptionTemplate.length < 30) {
      return NextResponse.json(
        { success: false, message: "Prescription template is too short." },
        { status: 400 },
      );
    }
    // signatureDataUrl is optional — empty string is fine, we just won't
    // store a signature image on the doctor profile.

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
    if (body.availability && typeof body.availability === "object") {
      try {
        await setAvailability(decoded.uid, body.availability);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[doctor/signup] availability seed failed:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[doctor/signup] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
