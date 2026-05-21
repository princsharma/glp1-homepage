// services/firebase/users.js
//
// Server-side helpers for the `users/{uid}` Firestore collection.
//
// All functions in this file go through the Admin SDK and therefore BYPASS
// Firestore Security Rules — they're meant to be called only from trusted
// server code (API route handlers). Never import this from a client component.
//
// Document shape:
//
//   users/{uid}
//   ├── email             string         — Firebase Auth email (always set)
//   ├── status            "incomplete" | "onboarded"
//   ├── currentStep       string         — last screen ID the user reached
//   ├── firstName         string?        — mirrored from form for queries
//   ├── lastName          string?
//   ├── phone             string?
//   ├── dob               string?        — YYYY-MM-DD
//   ├── consentHIPAA      boolean
//   ├── consentTelehealth boolean
//   ├── onboarding        map            — full snapshot of form state
//   ├── createdAt         timestamp
//   └── updatedAt         timestamp
//
// IMPORTANT: the password is NEVER stored here. Firebase Authentication
// stores the password (hashed, never plaintext) as a separate service,
// linked to this doc by the UID. We only persist profile data.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

const USERS_COLLECTION = "users";

// Fields we promote from the raw form to top-level for easy querying.
// Anything else lives under `onboarding`. The password field is explicitly
// blocklisted so it never reaches Firestore even if a client accidentally
// includes it in a save-progress request.
const TOP_LEVEL_FIELDS = ["email", "firstName", "lastName", "phone", "dob"];
const BLOCKLISTED_FIELDS = new Set(["password", "passwordConfirm"]);

// Valid role values. Anything else is rejected at create time.
const VALID_ROLES = new Set(["patient", "doctor", "admin"]);

/**
 * Create or update users/{uid}. Existing fields not present in `fields`
 * are preserved.
 *
 * `fields` may contain:
 *   - top-level scalars (email, firstName, lastName, …)
 *   - a `formSnapshot` object — merged into the nested `onboarding` field
 *   - any other arbitrary key/value pairs to set at the top level
 *
 * Returns `{ created: boolean }` so callers can react to first-time vs update.
 */
export async function upsertUser(uid, fields = {}) {
  const ref = adminDb.collection(USERS_COLLECTION).doc(uid);
  const snap = await ref.get();
  const now = FieldValue.serverTimestamp();

  const { formSnapshot, ...topLevel } = fields;

  // Build the nested onboarding map ONCE — we use it differently below
  // depending on whether the doc exists. Firestore semantics:
  //   - ref.set({ "a.b": val })    → literal top-level key "a.b" (BAD)
  //   - ref.update({ "a.b": val }) → nested path { a: { b: val } }   (GOOD)
  // So for `.set()` we must pass a real nested object; for `.update()` we
  // pass dot-pathed keys so unchanged sub-fields are preserved.
  const onboardingMap = {};
  if (formSnapshot && typeof formSnapshot === "object") {
    for (const [key, value] of Object.entries(formSnapshot)) {
      if (value === undefined) continue;
      if (BLOCKLISTED_FIELDS.has(key)) continue;
      onboardingMap[key] = value;
    }
  }

  if (!snap.exists) {
    // First save for this UID — write a real nested object via .set().
    // role is only honored at creation. Default is "patient" if no caller-
    // supplied role is provided (or the value is unknown). Subsequent
    // updates never change the role; promotions go through an admin tool.
    const requestedRole = topLevel.role;
    const role =
      typeof requestedRole === "string" && VALID_ROLES.has(requestedRole)
        ? requestedRole
        : "patient";
    const { role: _ignored, ...rest } = topLevel;
    await ref.set({
      role,
      status: "incomplete",
      createdAt: now,
      updatedAt: now,
      ...rest,
      onboarding: onboardingMap,
    });
    return { created: true };
  }

  // Existing doc: NEVER let an update flip the role. Strip it out defensively.
  if ("role" in topLevel) delete topLevel.role;

  // Existing doc — merge top-level fields and individual onboarding sub-fields
  // via dot-pathed update, which Firestore interprets as nested writes.
  const updates = { ...topLevel, updatedAt: now };
  for (const [key, value] of Object.entries(onboardingMap)) {
    updates[`onboarding.${key}`] = value;
  }
  await ref.update(updates);
  return { created: false };
}

/**
 * Admin-only. Return every patient (role === "patient") as a list of
 * plain DTOs for the admin patients table.
 */
export async function listAllPatientsForAdmin() {
  const snap = await adminDb
    .collection(USERS_COLLECTION)
    .where("role", "==", "patient")
    .get();

  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        email: data.email || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        fullName:
          [data.firstName, data.lastName].filter(Boolean).join(" ") ||
          data.email ||
          "—",
        phone: data.phone || "",
        dob: data.dob || "",
        status: data.status || "incomplete",
        createdAtMs:
          typeof data.createdAt?.toMillis === "function"
            ? data.createdAt.toMillis()
            : null,
      };
    })
    .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
}

/**
 * Admin-only. Updates editable patient fields. Role is never mutated.
 */
export async function adminUpdatePatient(uid, fields = {}) {
  const ref = adminDb.collection(USERS_COLLECTION).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Patient not found");
  if (snap.data().role && snap.data().role !== "patient") {
    throw new Error("Not a patient");
  }

  const updates = { updatedAt: FieldValue.serverTimestamp() };
  if (typeof fields.firstName === "string") updates.firstName = fields.firstName.trim();
  if (typeof fields.lastName === "string") updates.lastName = fields.lastName.trim();
  if (typeof fields.phone === "string") updates.phone = fields.phone.trim();
  if (typeof fields.status === "string") updates.status = fields.status;

  await ref.update(updates);
}

/**
 * Admin-only. Hard-deletes the patient's user doc.
 */
export async function adminDeleteUser(uid) {
  await adminDb.collection(USERS_COLLECTION).doc(uid).delete();
}

/**
 * Counts users grouped by role + status. Used by the admin overview.
 * Returns { patients: { total }, doctors: { total, active, pending, rejected } }.
 */
export async function countUsersByRole() {
  const snap = await adminDb.collection(USERS_COLLECTION).get();
  const out = {
    patients: { total: 0 },
    doctors: { total: 0, active: 0, pending: 0, rejected: 0, deactivated: 0 },
    admins: { total: 0 },
    signupsByDay: {}, // YYYY-MM-DD -> count, last 30d
  };
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  for (const d of snap.docs) {
    const data = d.data();
    const role = data.role || "patient";
    if (role === "patient") out.patients.total += 1;
    else if (role === "admin") out.admins.total += 1;
    else if (role === "doctor") {
      out.doctors.total += 1;
      const st = data.status || "pending";
      if (out.doctors[st] !== undefined) out.doctors[st] += 1;
    }

    const createdMs =
      typeof data.createdAt?.toMillis === "function"
        ? data.createdAt.toMillis()
        : null;
    if (createdMs && createdMs >= thirtyDaysAgo) {
      const day = new Date(createdMs).toISOString().slice(0, 10);
      out.signupsByDay[day] = (out.signupsByDay[day] || 0) + 1;
    }
  }
  return out;
}

/**
 * Take the full client `form` object, promote known scalar fields to
 * top-level on users/{uid}, stash the rest under `onboarding`.
 * Blocklisted fields (password, etc.) are dropped here too.
 */
export function projectFormToUserFields(form = {}) {
  const out = { formSnapshot: {} };
  for (const [key, value] of Object.entries(form)) {
    if (value === undefined) continue;
    if (BLOCKLISTED_FIELDS.has(key)) continue;
    if (TOP_LEVEL_FIELDS.includes(key)) {
      out[key] = value;
    } else {
      out.formSnapshot[key] = value;
    }
  }
  return out;
}
