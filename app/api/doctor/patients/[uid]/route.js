// app/api/doctor/patients/[uid]/route.js
//
// Full patient details for the signed-in doctor. We strictly verify the
// patient is assigned to THIS doctor before returning anything sensitive.
//
// Returns the user's top-level profile, the full onboarding map, and the
// list of appointments between this patient and this doctor.

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireDoctor(request) {
  const header = request.headers.get("authorization") || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!idToken) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
    if (!userSnap.exists || userSnap.data()?.role !== "doctor") return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  const decoded = await requireDoctor(request);
  if (!decoded) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { uid } = params || {};
  if (!uid) {
    return NextResponse.json({ success: false, message: "Missing uid" }, { status: 400 });
  }

  const userSnap = await adminDb.collection("users").doc(uid).get();
  if (!userSnap.exists || userSnap.data()?.role !== "patient") {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  const data = userSnap.data();
  const onb = data.onboarding || {};
  if (onb.doctorUid !== decoded.uid) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  // Pull appointments between this patient and this doctor.
  const apptSnap = await adminDb
    .collection("appointments")
    .where("patientUid", "==", uid)
    .where("doctorUid", "==", decoded.uid)
    .get();

  const appointments = apptSnap.docs
    .map((d) => {
      const a = d.data();
      return {
        id: d.id,
        date: a.date || "",
        time: a.time || "",
        type: a.type || "",
        status: a.status || "scheduled",
        notes: a.notes || "",
        durationMinutes: a.durationMinutes || 30,
      };
    })
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));

  const patient = {
    uid,
    email: data.email || "",
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    fullName:
      [data.firstName, data.lastName].filter(Boolean).join(" ") ||
      data.email ||
      "Patient",
    phone: data.phone || "",
    dob: data.dob || "",
    status: data.status || "incomplete",
    consentHIPAA: !!data.consentHIPAA,
    consentTelehealth: !!data.consentTelehealth,
    emailVerified: !!data.emailVerified,
    createdAtMs:
      typeof data.createdAt?.toMillis === "function"
        ? data.createdAt.toMillis()
        : null,
    onboarding: onb,
    appointments,
  };

  return NextResponse.json({ success: true, patient });
}
