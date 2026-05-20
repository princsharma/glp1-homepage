// app/login/page.jsx
//
// Patient sign-in. All sign-in state lives in useEmailPasswordSignIn; this
// page just supplies the patient-portal copy + features list to AuthShell
// and renders the form children.

"use client";

import { Suspense } from "react";
import Link from "next/link";
import AuthShell, { authStyles } from "@/components/auth/AuthShell";
import PasswordField from "@/components/PasswordField";
import { useEmailPasswordSignIn } from "@/lib/auth/useEmailPasswordSignIn";

const BRAND = {
  href: "/",
  em: "Ongo",
  suffix: " Weight Loss",
};

const PANEL = {
  kicker: "Patient portal",
  title: "Welcome back.",
  subtitle:
    "Pick up your weight-loss plan, refills, and care messages right where you left off.",
  features: [
    {
      title: "Your progress",
      desc: "Weekly check-ins and weight trends",
    },
    {
      title: "Your medication",
      desc: "Refills, deliveries, and dosing schedule",
    },
    {
      title: "Your care team",
      desc: "Message your doctor and review notes",
    },
  ],
  footnote: {
    text: "New to Ongo?",
    linkHref: "/weightloss-onboard",
    linkLabel: "Start your journey →",
  },
};

const CARD = {
  kicker: "Patient sign in",
  title: "Sign in to your dashboard",
  subtitle: "Use the email you signed up with.",
};

// useSearchParams (used inside the sign-in hook) requires a Suspense
// boundary above any component that calls it.
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className={authStyles.page}>
      <div className={authStyles.loadingFallback}>Loading…</div>
    </main>
  );
}

function LoginContent() {
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
  } = useEmailPasswordSignIn({ defaultNext: "/dashboard" });

  return (
    <AuthShell variant="patient" brand={BRAND} panel={PANEL} card={CARD}>
      <form onSubmit={signIn} className={authStyles.form} noValidate>
        <label className={authStyles.field}>
          <span className={authStyles.fieldLabel}>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authStyles.input}
            placeholder="you@example.com"
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

        <p className={authStyles.smallMeta}>
          Don&apos;t have an account?{" "}
          <Link href="/weightloss-onboard" className={authStyles.metaLink}>
            Start your journey →
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
