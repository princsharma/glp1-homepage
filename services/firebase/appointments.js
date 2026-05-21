// services/firebase/appointments.js
//
// Read/write helpers for the `appointments` collection. Schema:
//
//   appointments/{id}
//   ├── patientUid          string
//   ├── patientName         string  — denormalized for the doctor's table
//   ├── patientEmail        string
//   ├── doctorUid           string
//   ├── doctorName          string  — denormalized for the patient's table
//   ├── type                string  — "Ozempic" | "Wegovy" | "Zepbound" |
//   │                                 "Initial consultation"
//   ├── date                string  — YYYY-MM-DD in the doctor's timezone
//   ├── time                string  — HH:mm 24h
//   ├── durationMinutes     number
//   ├── status              string  — "scheduled" | "completed" | "cancelled"
//   ├── notes               string  — doctor's session notes
//   ├── createdAt           timestamp
//   └── updatedAt           timestamp

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

const COLLECTION = "appointments";

const VALID_STATUS = new Set(["scheduled", "completed", "cancelled"]);

export const APPOINTMENT_TYPES = [
  "Initial consultation",
  "Ozempic",
  "Wegovy",
  "Zepbound",
  "Follow-up",
];

function nowTs() {
  return FieldValue.serverTimestamp();
}

export async function createAppointment(input) {
  const data = {
    patientUid: String(input.patientUid || ""),
    patientName: String(input.patientName || ""),
    patientEmail: String(input.patientEmail || ""),
    doctorUid: String(input.doctorUid || ""),
    doctorName: String(input.doctorName || ""),
    type: APPOINTMENT_TYPES.includes(input.type)
      ? input.type
      : "Initial consultation",
    date: String(input.date || ""),
    time: String(input.time || ""),
    durationMinutes: Number(input.durationMinutes) || 30,
    status: VALID_STATUS.has(input.status) ? input.status : "scheduled",
    notes: typeof input.notes === "string" ? input.notes : "",
    createdAt: nowTs(),
    updatedAt: nowTs(),
  };
  if (!data.patientUid || !data.doctorUid || !data.date || !data.time) {
    throw new Error("appointment is missing required fields");
  }
  const ref = await adminDb.collection(COLLECTION).add(data);
  return { id: ref.id, ...data };
}

export async function updateAppointment(id, fields = {}) {
  const updates = { updatedAt: nowTs() };
  if (typeof fields.notes === "string") updates.notes = fields.notes;
  if (VALID_STATUS.has(fields.status)) updates.status = fields.status;
  if (typeof fields.type === "string" && APPOINTMENT_TYPES.includes(fields.type)) {
    updates.type = fields.type;
  }
  await adminDb.collection(COLLECTION).doc(id).update(updates);
}

export async function getAppointment(id) {
  const snap = await adminDb.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return projectAppointment(snap.id, snap.data());
}

export async function listAppointmentsForDoctor(doctorUid) {
  const snap = await adminDb
    .collection(COLLECTION)
    .where("doctorUid", "==", doctorUid)
    .get();
  return snap.docs
    .map((d) => projectAppointment(d.id, d.data()))
    .sort(compareByDateTimeDesc);
}

export async function listAppointmentsForPatient(patientUid) {
  const snap = await adminDb
    .collection(COLLECTION)
    .where("patientUid", "==", patientUid)
    .get();
  return snap.docs
    .map((d) => projectAppointment(d.id, d.data()))
    .sort(compareByDateTimeDesc);
}

/**
 * Returns Set of "<date>|<time>" keys for slots that are already booked
 * with the given doctor, so the slot generator can exclude them.
 */
export async function bookedSlotKeysForDoctor(doctorUid) {
  const snap = await adminDb
    .collection(COLLECTION)
    .where("doctorUid", "==", doctorUid)
    .where("status", "in", ["scheduled", "completed"])
    .get();
  const out = new Set();
  for (const d of snap.docs) {
    const data = d.data();
    if (data.date && data.time) out.add(`${data.date}|${data.time}`);
  }
  return out;
}

/**
 * Admin-only. Lists every appointment across the platform. Sorted with
 * the most recent first.
 */
export async function listAllAppointmentsForAdmin() {
  const snap = await adminDb.collection(COLLECTION).get();
  return snap.docs
    .map((d) => projectAppointment(d.id, d.data()))
    .sort(compareByDateTimeDesc);
}

/**
 * Admin-only. Hard-deletes an appointment doc.
 */
export async function adminDeleteAppointment(id) {
  await adminDb.collection(COLLECTION).doc(id).delete();
}

/**
 * Admin overview helper. Returns rolling counts for the last 30 days
 * (booked appointments per day) and a revenue tally derived from how
 * many appointments we have in each state.
 */
export async function appointmentStatsForAdmin() {
  const snap = await adminDb.collection(COLLECTION).get();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const out = {
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    bookedByDay: {}, // YYYY-MM-DD -> count, last 30d (by createdAt)
  };
  for (const d of snap.docs) {
    const data = d.data();
    out.total += 1;
    const st = data.status || "scheduled";
    if (out[st] !== undefined) out[st] += 1;
    const createdMs =
      typeof data.createdAt?.toMillis === "function"
        ? data.createdAt.toMillis()
        : null;
    if (createdMs && createdMs >= thirtyDaysAgo) {
      const day = new Date(createdMs).toISOString().slice(0, 10);
      out.bookedByDay[day] = (out.bookedByDay[day] || 0) + 1;
    }
  }
  return out;
}

function projectAppointment(id, data) {
  return {
    id,
    patientUid: data.patientUid || "",
    patientName: data.patientName || "",
    patientEmail: data.patientEmail || "",
    doctorUid: data.doctorUid || "",
    doctorName: data.doctorName || "",
    type: data.type || "Initial consultation",
    date: data.date || "",
    time: data.time || "",
    durationMinutes: data.durationMinutes || 30,
    status: data.status || "scheduled",
    notes: data.notes || "",
    createdAtMs:
      typeof data.createdAt?.toMillis === "function"
        ? data.createdAt.toMillis()
        : null,
    updatedAtMs:
      typeof data.updatedAt?.toMillis === "function"
        ? data.updatedAt.toMillis()
        : null,
  };
}

function compareByDateTimeDesc(a, b) {
  const aKey = `${a.date}T${a.time}`;
  const bKey = `${b.date}T${b.time}`;
  return bKey.localeCompare(aKey);
}
