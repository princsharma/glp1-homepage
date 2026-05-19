// services/firebase/doctors.js
//
// Server-side helpers for querying users with role === "doctor".
// All functions use the Admin SDK and bypass Firestore Security Rules —
// invoke only from trusted server code.

import { adminDb } from "@/lib/firebase/admin";

const USERS_COLLECTION = "users";

/**
 * Return every active doctor as a list of plain DTOs safe for the patient
 * picker. Excludes anything that doesn't belong on a public profile (consent
 * flags, onboarding, etc.).
 */
export async function listActiveDoctors() {
  const snap = await adminDb
    .collection(USERS_COLLECTION)
    .where("role", "==", "doctor")
    .where("status", "==", "active")
    .get();

  return snap.docs.map((d) => projectDoctor(d.id, d.data()));
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
