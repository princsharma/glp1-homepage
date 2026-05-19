// app/api/appointments/book/route.js
//
// Called when the patient finalizes their booking (typically right after
// payment succeeds). Verifies the patient's ID token, confirms the chosen
// slot is still available, then creates the appointment in Firestore.

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import {
  bookedSlotKeysForDoctor,
  createAppointment,
} from "@/services/firebase/appointments";
import { getDoctor } from "@/services/firebase/doctors";

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
    const doctorUid = String(body.doctorUid || "");
    const date = String(body.date || "");
    const time = String(body.time || "");
    const type = String(body.type || "Initial consultation");

    if (!doctorUid || !date || !time) {
      return NextResponse.json(
        { success: false, message: "doctorUid, date, and time are required." },
        { status: 400 },
      );
    }

    const doctor = await getDoctor(doctorUid);
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Doctor not found." },
        { status: 404 },
      );
    }

    // Race-condition guard — re-check the slot is still free.
    const booked = await bookedSlotKeysForDoctor(doctorUid);
    if (booked.has(`${date}|${time}`)) {
      return NextResponse.json(
        { success: false, message: "That slot was just taken. Please pick another." },
        { status: 409 },
      );
    }

    // Pull patient info from their users/{uid} doc so we can denormalize.
    const patientSnap = await adminDb.collection("users").doc(decoded.uid).get();
    const patient = patientSnap.exists ? patientSnap.data() : {};
    const patientName =
      [patient.firstName, patient.lastName].filter(Boolean).join(" ") ||
      decoded.email ||
      "Patient";

    const appointment = await createAppointment({
      patientUid: decoded.uid,
      patientName,
      patientEmail: patient.email || decoded.email || "",
      doctorUid,
      doctorName: doctor.fullName,
      type,
      date,
      time,
      durationMinutes: 30,
      status: "scheduled",
    });

    return NextResponse.json({ success: true, appointment });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[appointments/book] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
