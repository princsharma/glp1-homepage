// services/firebase/doctors.js
//
// Server-side helpers for querying users with role === "doctor".
// All functions use the Admin SDK and bypass Firestore Security Rules —
// invoke only from trusted server code.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

const USERS_COLLECTION = "users";

// Number of doctors surfaced in the patient picker. Hard-coded because
// the picker UI was designed around "meet your physician" with a small
// curated set; if this changes the screen layout needs a redesign too.
const PUBLIC_DOCTOR_LIMIT = 3;

/**
 * Return the top doctors active on the platform, ordered by admin-set
 * priority (descending), capped to PUBLIC_DOCTOR_LIMIT.
 *
 * Patient picker calls this — only "active" status is included; pending /
 * rejected doctors are never surfaced to patients.
 */
export async function listActiveDoctors() {
  const snap = await adminDb
    .collection(USERS_COLLECTION)
    .where("role", "==", "doctor")
    .where("status", "==", "active")
    .get();

  const all = snap.docs.map((d) => ({
    ...projectDoctor(d.id, d.data()),
    priority: typeof d.data().priority === "number" ? d.data().priority : 0,
  }));

  all.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.fullName.localeCompare(b.fullName);
  });

  return all.slice(0, PUBLIC_DOCTOR_LIMIT).map(({ priority: _p, ...rest }) => rest);
}

/**
 * Look up a single doctor by uid. Returns null if not a doctor.
 */
export async function getDoctor(uid) {
  const snap = await adminDb.collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (data.role !== "doctor") return null;
  return projectDoctor(snap.id, data);
}

/**
 * Admin-only helper. Returns EVERY doctor (pending, active, rejected,
 * deactivated), with priority + status fields included so the admin
 * table can render them.
 */
export async function listAllDoctorsForAdmin() {
  const snap = await adminDb
    .collection(USERS_COLLECTION)
    .where("role", "==", "doctor")
    .get();

  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        ...projectDoctor(d.id, data),
        status: data.status || "pending",
        priority: typeof data.priority === "number" ? data.priority : 0,
        createdAtMs:
          typeof data.createdAt?.toMillis === "function"
            ? data.createdAt.toMillis()
            : null,
      };
    })
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.fullName.localeCompare(b.fullName);
    });
}

/**
 * Admin-only helper. Updates the mutable admin-controlled fields on a
 * doctor: status, priority, and editable profile bits. No-op for fields
 * not supplied.
 */
export async function adminUpdateDoctor(uid, fields = {}) {
  const ref = adminDb.collection(USERS_COLLECTION).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Doctor not found");
  if (snap.data().role !== "doctor") throw new Error("Not a doctor");

  const updates = { updatedAt: FieldValue.serverTimestamp() };

  if (typeof fields.status === "string") {
    const next = fields.status;
    if (!["pending", "active", "rejected", "deactivated"].includes(next)) {
      throw new Error("Invalid status");
    }
    updates.status = next;
  }
  if (Object.prototype.hasOwnProperty.call(fields, "priority")) {
    const n = Number(fields.priority);
    if (!Number.isFinite(n)) throw new Error("Invalid priority");
    updates.priority = n;
  }
  if (typeof fields.firstName === "string") updates.firstName = fields.firstName.trim();
  if (typeof fields.lastName === "string") updates.lastName = fields.lastName.trim();
  if (typeof fields.phone === "string") updates.phone = fields.phone.trim();
  if (typeof fields.bio === "string") updates.bio = fields.bio.trim();

  await ref.update(updates);
}

/**
 * Admin-only. Hard-deletes a doctor doc. Caller is responsible for any
 * downstream cleanup (appointments, availability) — see the admin route
 * handler.
 */
export async function adminDeleteDoctor(uid) {
  await adminDb.collection(USERS_COLLECTION).doc(uid).delete();
}

function projectDoctor(uid, data) {
  const licenses = Array.isArray(data.licenses) ? data.licenses : [];
  return {
    uid,
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    fullName:
      [data.firstName, data.lastName].filter(Boolean).join(" ") || "Doctor",
    email: data.email || "",
    phone: data.phone || "",
    bio: data.bio || "",
    photoURL: data.photoURL || "",
    licenses: licenses.map((l) => ({
      state: l.state || "",
      licenseNumber: l.licenseNumber || "",
      licenseType: l.licenseType || "",
    })),
    licensedStates: Array.from(
      new Set(licenses.map((l) => l.state).filter(Boolean)),
    ),
  };
}
