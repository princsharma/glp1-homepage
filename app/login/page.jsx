// app/login/page.jsx
//
// Standalone sign-in for returning users. Wraps Firebase Auth's
// signInWithEmailAndPassword. On success, follows ?next= if present (so
// the role guards can deep-link back), otherwise lets /dashboard route by
// role.
//
// Includes a "Forgot password?" link that triggers Firebase's built-in
// reset email (same as the onboarding S20 forgot-password path), so the
// recovery story works without us hosting our own reset UI yet.

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

// useSearchParams must be inside a Suspense boundary for Next.js App Router
// static analysis. The page splits its work between the boundary parent and
// the inner content component.
export default function LoginPage() {
  return (
    <Suspense fallback={<main style={layout}>Loading…</main>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const { user, loading } = useAuthUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // If they're already signed in, just bounce them onward.
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
      // Auth state change effect above will redirect.
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
    <main style={layout}>
      <form onSubmit={onSubmit} style={card}>
        <div style={kicker}>Ongo Weight Loss</div>
        <h1 style={{ margin: "0 0 24px", fontSize: 24, fontWeight: 600 }}>
          Sign in
        </h1>

        <label style={labelStyle}>
          <span style={labelTextStyle}>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="you@example.com"
            required
          />
        </label>

        <label style={labelStyle}>
          <span style={labelTextStyle}>Password</span>
          <PasswordField
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            inputStyle={inputStyle}
            required
          />
        </label>

        {error && <div style={errStyle} role="alert">{error}</div>}
        {resetSent && (
          <div style={infoStyle} role="status">
            Reset email sent. Check your inbox, then return here to sign in.
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          style={submitStyle(!canSubmit)}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <div style={metaRow}>
          <button type="button" onClick={onForgot} style={linkBtnStyle}>
            Forgot password?
          </button>
          <Link href="/weightloss-onboard" style={linkStyle}>
            Start onboarding →
          </Link>
        </div>

        <div style={clinicianRow}>
          <span>Are you a clinician?</span>
          <Link href="/doctor-onboard" style={linkStyle}>
            Register as a doctor →
          </Link>
        </div>
      </form>
    </main>
  );
}

const clinicianRow = {
  marginTop: 8,
  paddingTop: 14,
  borderTop: "1px solid #e5e0d8",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: 13,
  color: "#5c6b73",
  gap: 12,
  flexWrap: "wrap",
};

const layout = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 32,
  background: "#f6f7f9",
  fontFamily: "system-ui, sans-serif",
  color: "#1f2933",
};

const card = {
  width: "100%",
  maxWidth: 400,
  background: "white",
  borderRadius: 12,
  padding: 32,
  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const kicker = {
  fontSize: 12,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#5c6470",
  marginBottom: 4,
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 14,
};

const labelTextStyle = { color: "#5c6470", fontSize: 13 };

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #d6dae0",
  fontSize: 15,
  outline: "none",
};

const errStyle = {
  background: "#fdecea",
  color: "#a02928",
  padding: "8px 12px",
  borderRadius: 8,
  fontSize: 14,
};

const infoStyle = {
  background: "#e6f4ea",
  color: "#1e7c3a",
  padding: "8px 12px",
  borderRadius: 8,
  fontSize: 14,
};

function submitStyle(disabled) {
  return {
    marginTop: 8,
    padding: "12px 16px",
    borderRadius: 8,
    background: disabled ? "#b5bcc6" : "#1f2933",
    color: "white",
    border: "none",
    fontSize: 15,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

const metaRow = {
  marginTop: 12,
  display: "flex",
  justifyContent: "space-between",
  fontSize: 14,
};

const linkStyle = { color: "#2856d6", textDecoration: "none" };

const linkBtnStyle = {
  background: "none",
  border: "none",
  padding: 0,
  color: "#2856d6",
  textDecoration: "underline",
  cursor: "pointer",
  fontSize: 14,
};
