// app/doctor/doctor-login/page.jsx
//
// Clinician-only sign-in page, kept on its own URL so patients never see
// any doctor-facing entry points. Same Firebase Auth flow as the patient
// /login page, but the visual language matches the doctor onboarding page
// (green brand palette, two-column hero card).
//
// On success, follows ?next= if present, otherwise lets /dashboard route
// the user by role. If a patient account signs in here we still let them
// through — /dashboard does the role-based redirect.

"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { isValidEmail } from "@/app/weightloss-onboard/utils";
import PasswordField from "@/components/PasswordField";
import styles from "./doctor-login.module.css";

export default function DoctorLoginPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.loadingFallback}>Loading…</div>
        </main>
      }
    >
      <DoctorLoginContent />
    </Suspense>
  );
}

function DoctorLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard/doctor";

  const { user, loading } = useAuthUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  const canSubmit =
    !submitting && isValidEmail(email) && password.length >= 1;

  const onSubmit = async (e) => {
    e.preventDefault();
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
    } catch (err) {
      const code = err?.code || "";
      if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-login-credentials"
      ) {
        setError("Wrong email or password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Wait a minute and try again.");
      } else {
        setError(err?.message || "Could not sign in. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onForgot = async () => {
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

  return (
    <main className={styles.page}>
      <div className={styles.heroOrb} aria-hidden />

      <div className={styles.shell}>
        {/* Brand / value panel */}
        <aside className={styles.brandPanel} aria-hidden>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>O</span>
            <span>
              <em className={styles.brandEm}>Ongo</em> for Clinicians
            </span>
          </Link>

          <div className={styles.brandBody}>
            <span className={styles.kicker}>Clinician portal</span>
            <h1 className={styles.brandTitle}>Welcome back.</h1>
            <p className={styles.brandSubtitle}>
              Sign in to see today&apos;s consults, manage your availability,
              and review payouts.
            </p>

            <ul className={styles.features}>
              <li>
                <span className={styles.featureDot} />
                <span>
                  <strong>Patients &amp; consults</strong>
                  <em>Your dashboard, charts, and chart notes</em>
                </span>
              </li>
              <li>
                <span className={styles.featureDot} />
                <span>
                  <strong>Availability</strong>
                  <em>Adjust weekly hours and block-out dates</em>
                </span>
              </li>
              <li>
                <span className={styles.featureDot} />
                <span>
                  <strong>Payouts</strong>
                  <em>Track earnings and update banking</em>
                </span>
              </li>
            </ul>
          </div>

          <div className={styles.brandFootnote}>
            New to Ongo?{" "}
            <Link href="/doctor/doctor-onboard" className={styles.brandLink}>
              Register as a doctor →
            </Link>
          </div>
        </aside>

        {/* Sign-in card */}
        <section className={styles.card}>
          <header className={styles.cardHead}>
            <span className={styles.cardKicker}>Doctor sign in</span>
            <h2 className={styles.cardTitle}>Sign in to your dashboard</h2>
            <p className={styles.cardSubtitle}>
              Use the work email you registered with.
            </p>
          </header>

          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Work email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="vanessa@your-clinic.com"
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabelRow}>
                <span className={styles.fieldLabel}>Password</span>
                <button
                  type="button"
                  onClick={onForgot}
                  className={styles.forgotBtn}
                >
                  Forgot?
                </button>
              </span>
              <PasswordField
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                inputStyle={passwordInputStyle}
                required
              />
            </label>

            {error && (
              <div className={styles.error} role="alert">
                {error}
              </div>
            )}
            {resetSent && (
              <div className={styles.info} role="status">
                Reset email sent. Check your inbox, then return here to sign in.
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={styles.submit}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

// PasswordField takes an inline style object, so we pass the same shape
// the form's `.input` class uses. Keeping it here (rather than CSS) is the
// simplest way to match the rest of the form without changing the shared
// PasswordField component.
const passwordInputStyle = {
  width: "100%",
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  padding: "11px 12px",
  fontSize: "14.5px",
  outline: "none",
  color: "var(--color-text)",
};
