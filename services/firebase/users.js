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
    // role defaults to "patient" here ONLY at creation. It is never re-set
    // by subsequent updates (admins/doctors get promoted via a separate
    // admin tool, not by the onboarding form).
    await ref.set({
      role: "patient",
      status: "incomplete",
      createdAt: now,
      updatedAt: now,
      ...topLevel,
      onboarding: onboardingMap,
    });
    return { created: true };
  }

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
