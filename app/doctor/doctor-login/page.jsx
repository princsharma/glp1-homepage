// app/doctor/doctor-login/page.jsx
//
// Clinician sign-in. Same shared shell + sign-in hook as the patient
// /login page; only the copy, features list, and visual variant differ.
// Kept on its own URL so patients never see clinician-facing entry points.

"use client";

import { Suspense } from "react";
import AuthShell, { authStyles } from "@/components/auth/AuthShell";
import PasswordField from "@/components/PasswordField";
import { useEmailPasswordSignIn } from "@/lib/auth/useEmailPasswordSignIn";

const BRAND = {
  href: "/",
  em: "Ongo",
  suffix: " for Clinicians",
};

const PANEL = {
  kicker: "Clinician portal",
  title: "Welcome back.",
  subtitle:
    "Sign in to see today's consults, manage your availability, and review payouts.",
  features: [
    {
      title: "Patients & consults",
      desc: "Your dashboard, charts, and chart notes",
    },
    {
      title: "Availability",
      desc: "Adjust weekly hours and block-out dates",
    },
    {
      title: "Payouts",
      desc: "Track earnings and update banking",
    },
  ],
  footnote: {
    text: "New to Ongo?",
    linkHref: "/doctor/doctor-onboard",
    linkLabel: "Register as a doctor →",
  },
};

const CARD = {
  kicker: "Doctor sign in",
  title: "Sign in to your dashboard",
  subtitle: "Use the work email you registered with.",
};

export default function DoctorLoginPage() {
  return (
    <Suspense fallback={<DoctorLoginFallback />}>
      <DoctorLoginContent />
    </Suspense>
  );
}

function DoctorLoginFallback() {
  return (
    <main className={`${authStyles.page} ${authStyles.clinician}`}>
      <div className={authStyles.loadingFallback}>Loading…</div>
    </main>
  );
}

function DoctorLoginContent() {
  const {
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
  } = useEmailPasswordSignIn({ defaultNext: "/dashboard/doctor" });

  return (
    <AuthShell variant="clinician" brand={BRAND} panel={PANEL} card={CARD}>
      <form onSubmit={signIn} className={authStyles.form} noValidate>
        <label className={authStyles.field}>
          <span className={authStyles.fieldLabel}>Work email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authStyles.input}
            placeholder="vanessa@your-clinic.com"
            required
          />
        </label>

        <label className={authStyles.field}>
          <span className={authStyles.fieldLabelRow}>
            <span className={authStyles.fieldLabel}>Password</span>
            <button
              type="button"
              onClick={sendResetEmail}
              className={authStyles.forgotBtn}
            >
              Forgot?
            </button>
          </span>
          <PasswordField
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authStyles.input}
            required
          />
        </label>

        {error && (
          <div className={authStyles.error} role="alert">
            {error}
          </div>
        )}
        {resetSent && (
          <div className={authStyles.info} role="status">
            Reset email sent. Check your inbox, then return here to sign in.
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={authStyles.submit}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
