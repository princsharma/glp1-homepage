// app/admin/admin-login/page.jsx
//
// Admin sign-in. Same shared shell + sign-in hook as the patient /login
// and doctor /doctor/doctor-login pages — only the copy and visual
// variant differ. Lives on its own URL with no link from the public
// marketing site so the entry point isn't advertised to end users.

"use client";

import { Suspense } from "react";
import AuthShell, { authStyles } from "@/components/auth/AuthShell";
import PasswordField from "@/components/PasswordField";
import { useEmailPasswordSignIn } from "@/lib/auth/useEmailPasswordSignIn";

const BRAND = {
  href: "/",
  em: "Ongo",
  suffix: " Admin",
};

const PANEL = {
  kicker: "Operations console",
  title: "Sign in to manage the platform.",
  subtitle:
    "Review clinician applications, manage patient accounts, and keep an eye on bookings and revenue.",
  features: [
    {
      title: "Doctor verification",
      desc: "Approve, reject, and prioritize clinicians",
    },
    {
      title: "Patient & account oversight",
      desc: "Search, edit, or remove user accounts",
    },
    {
      title: "Activity & growth",
      desc: "Daily signups, bookings, and revenue at a glance",
    },
  ],
};

const CARD = {
  kicker: "Administrator sign in",
  title: "Sign in to the admin console",
  subtitle: "Authorized personnel only.",
};

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginContent />
    </Suspense>
  );
}

function AdminLoginFallback() {
  return (
    <main className={`${authStyles.page} ${authStyles.clinician}`}>
      <div className={authStyles.loadingFallback}>Loading…</div>
    </main>
  );
}

function AdminLoginContent() {
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
  } = useEmailPasswordSignIn({ defaultNext: "/dashboard/admin" });

  return (
    <AuthShell variant="clinician" brand={BRAND} panel={PANEL} card={CARD}>
      <form onSubmit={signIn} className={authStyles.form} noValidate>
        <label className={authStyles.field}>
          <span className={authStyles.fieldLabel}>Admin email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authStyles.input}
            placeholder="admin@ongo.example"
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
