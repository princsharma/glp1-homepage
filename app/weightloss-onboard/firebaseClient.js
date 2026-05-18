// app/weightloss-onboard/firebaseClient.js
//
// Client-side helpers for the onboarding form's auth + persistence flow.
//
// Design — user types email + password on Screen S20:
//
//   1. Try `signInWithEmailAndPassword(email, password)`.
//      - Success: returning user, same credentials match → proceed.
//   2. If sign-in fails (no such user OR wrong password — Firebase deliberately
//      conflates these to prevent email enumeration), try
//      `createUserWithEmailAndPassword(email, password)`.
//      - Success: brand-new account, signed in.
//      - Fails with `auth/email-already-in-use`: account exists but the
//        password the user typed does not match. Surface a "forgot password"
//        action so they can recover.
//   3. After successful auth (either branch), call our save-progress route
//      to persist the form snapshot into users/{uid}.
//
// Passwords NEVER leave the browser except via the Firebase Auth SDK, which
// sends them over HTTPS straight to Firebase. Our backend never sees them
// and our Firestore document never stores them.

"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase/auth";

/**
 * Authenticate the user on the email screen. Tries sign-in first; falls back
 * to sign-up if no account exists yet. Returns the auth result and an
 * `isNew` flag.
 *
 * Throws on:
 *   - 'EMAIL_REGISTERED_WRONG_PASSWORD' → email exists, password mismatch
 *   - 'WEAK_PASSWORD'                   → Firebase rejected the password
 *   - any other unexpected error
 */
export async function signInOrSignUp(email, password) {
  // Step 1: Try sign-in.
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { uid: cred.user.uid, isNew: false };
  } catch (err) {
    const code = err?.code || "";
    // These codes all mean: either no account, or wrong password (Firebase's
    // email-enumeration protection collapses them into one). We try sign-up
    // next to distinguish the two cases.
    const ambiguousFail =
      code === "auth/invalid-credential" ||
      code === "auth/user-not-found" ||
      code === "auth/wrong-password" ||
      code === "auth/invalid-login-credentials";
    if (!ambiguousFail) throw err;
  }

  // Step 2: Try sign-up.
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return { uid: cred.user.uid, isNew: true };
  } catch (err) {
    const code = err?.code || "";
    if (code === "auth/email-already-in-use") {
      // Sign-in failed AND email is taken → wrong password for an existing
      // account. Throw a stable, code-style error the UI can branch on.
      const e = new Error(
        "An account with this email already exists. If you forgot your password, use the reset link below.",
      );
      e.kind = "EMAIL_REGISTERED_WRONG_PASSWORD";
      throw e;
    }
    if (code === "auth/weak-password") {
      const e = new Error("Password is too weak. Please choose a stronger one.");
      e.kind = "WEAK_PASSWORD";
      throw e;
    }
    throw err;
  }
}

/**
 * Trigger Firebase's built-in password-reset email. Uses Firebase's hosted
 * reset page (no Mautic / custom template needed). The user gets a working
 * "set a new password" link in their inbox.
 */
export async function sendResetEmail(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Save the current form snapshot for the signed-in user.
 * Best-effort: failures are swallowed so a background save never blocks UX.
 * Sends `password` is stripped server-side regardless, but we also strip it
 * here defensively so it never even goes over the wire.
 */
export async function saveOnboardingProgress(form, currentStep, status) {
  const user = auth.currentUser;
  if (!user) return { skipped: true };

  let idToken;
  try {
    idToken = await user.getIdToken();
  } catch {
    return { skipped: true };
  }

  // Defensive: strip auth-related fields before sending. Server also blocks
  // these (services/firebase/users.js BLOCKLISTED_FIELDS), but no reason to
  // even put them on the wire.
  const { password, passwordConfirm, ...safeForm } = form || {};

  // eslint-disable-next-line no-console
  console.log(
    `[onboarding] saving (screen=${currentStep}${status ? `, status=${status}` : ""}) →`,
    safeForm,
  );

  try {
    const res = await fetch("/api/onboarding/save-progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ form: safeForm, currentStep, status }),
      keepalive: true,
    });
    // eslint-disable-next-line no-console
    console.log(
      `[onboarding] save-progress response: ${res.status}`,
      await res.clone().json().catch(() => null),
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[onboarding] save-progress network error:", err);
  }
  return { skipped: false };
}

/**
 * Resolves once Firebase Auth has restored its session from storage (or
 * determined that none exists). Useful for hydration on mount.
 */
export function waitForAuthReady() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}
