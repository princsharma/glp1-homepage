// lib/auth/useEmailPasswordSignIn.js
//
// Sign-in state + side-effects shared by every email/password login page
// (patient /login, doctor /doctor/doctor-login, and any future portal).
//
//   const {
//     email, setEmail,
//     password, setPassword,
//     error, resetSent, submitting, canSubmit,
//     signIn, sendResetEmail,
//   } = useEmailPasswordSignIn({ defaultNext: "/dashboard/doctor" });
//
// Behavior:
//   - Reads ?next= and redirects there once auth state goes truthy.
//   - signIn() runs Firebase signInWithEmailAndPassword with error mapping
//     for the messages we actually want users to see.
//   - sendResetEmail() uses Firebase's built-in reset email; surfaces a
//     friendly status flag (resetSent) and clears it on the next signIn.

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { isValidEmail } from "@/app/weightloss-onboard/utils";

export function useEmailPasswordSignIn({ defaultNext = "/dashboard" } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || defaultNext;

  const { user, loading } = useAuthUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  const canSubmit =
    !submitting && isValidEmail(email) && password.length >= 1;

  const signIn = async (e) => {
    e?.preventDefault?.();
    if (!canSubmit) return;
    setError("");
    setResetSent(false);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
      // Auth-state change effect above will redirect to `next`.
    } catch (err) {
      setError(mapSignInError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const sendResetEmail = async () => {
    if (!isValidEmail(email)) {
      setError("Enter your email above first.");
      return;
    }
    setError("");
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setResetSent(true);
    } catch (err) {
      setError(err?.message || "Could not send the reset email.");
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    resetSent,
    submitting,
    canSubmit,
    signIn,
    sendResetEmail,
  };
}

function mapSignInError(err) {
  const code = err?.code || "";
  if (
    code === "auth/invalid-credential" ||
    code === "auth/user-not-found" ||
    code === "auth/wrong-password" ||
    code === "auth/invalid-login-credentials"
  ) {
    return "Wrong email or password.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Wait a minute and try again.";
  }
  return err?.message || "Could not sign in. Please try again.";
}
