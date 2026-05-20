// app/api/appointments/book/route.js
//
// Called when the patient finalizes their booking (typically right after
// payment succeeds). Verifies the patient's ID token, confirms the chosen
// slot is still available, then creates the appointment in Firestore.

import { adminDb } from "@/lib/firebase/admin";
import {
  bookedSlotKeysForDoctor,
  createAppointment,
} from "@/services/firebase/appointments";
import { getDoctor } from "@/services/firebase/doctors";
import { fail, ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withAuth(async (request, _ctx, { decoded }) => {
  const body = await request.json().catch(() => ({}));
  const doctorUid = String(body.doctorUid || "");
  const date = String(body.date || "");
  const time = String(body.time || "");
  const type = String(body.type || "Initial consultation");

  if (!doctorUid || !date || !time) {
    return fail("doctorUid, date, and time are required.", 400);
  }

  const doctor = await getDoctor(doctorUid);
  if (!doctor) return fail("Doctor not found.", 404);

  // Race-condition guard — re-check the slot is still free.
  const booked = await bookedSlotKeysForDoctor(doctorUid);
  if (booked.has(`${date}|${time}`)) {
    return fail("That slot was just taken. Please pick another.", 409);
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

  return ok({ appointment });
});
