// Section 2 — sign-in credentials (email + password with show/hide).
// `showPw` is local state since no other section cares about it.

"use client";

import { useState } from "react";
import styles from "../doctor-onboard.module.css";
import Section from "./Section";
import Field from "./Field";

export default function CredentialsSection({ values, update, pwHint }) {
  const [showPw, setShowPw] = useState(false);

  return (
    <Section number="2" title="Sign-in credentials">
      <Field label="Work email" required>
        <input
          className={styles.input}
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="vanessa@your-clinic.com"
        />
      </Field>
      <Field
        label="Password"
        required
        hint={pwHint || "At least 8 characters with one letter and one number."}
        hintTone={pwHint ? "warn" : "muted"}
      >
        <div className={styles.pwWrap}>
          <input
            className={styles.input}
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => update("password", e.target.value)}
            placeholder="••••••••"
          />
          <button
            type="button"
            className={styles.pwToggle}
            onClick={() => setShowPw((s) => !s)}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
      </Field>
    </Section>
  );
}
