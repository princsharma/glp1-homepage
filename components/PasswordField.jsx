// components/PasswordField.jsx
//
// Drop-in replacement for <input type="password"> with a built-in
// show/hide-password eye toggle.
//
// Used by both /weightloss-onboard (S20 sign-up screen) and /login.
// Forwards every standard input prop (value, onChange, name, autoComplete,
// className, style, …) so it slots into either the form's CSS-module
// styling or the login page's inline styling without modification.
//
// Accessibility:
//   - Toggle is a real <button type="button">, so it never submits a form
//   - aria-label flips between "Show password" / "Hide password" so screen
//     readers know what state they're toggling

"use client";

import { useState } from "react";

export default function PasswordField({
  value,
  onChange,
  placeholder = "Password",
  autoComplete = "current-password",
  className,
  style,
  inputStyle,
  ...rest
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        display: "block",
        ...style,
      }}
    >
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={className}
        // Reserve room on the right edge so the eye icon never overlaps text.
        // Merge after the caller's inputStyle so caller can override if needed.
        style={{ paddingRight: 42, width: "100%", ...inputStyle }}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
        style={btnStyle}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

const btnStyle = {
  position: "absolute",
  right: 6,
  top: "50%",
  transform: "translateY(-50%)",
  background: "transparent",
  border: "none",
  padding: 8,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--color-text-soft, #8a9a9e)",
  borderRadius: 6,
};

/* ─── Icons ──────────────────────────────────────────────────────────── */

function iconProps() {
  return {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
}

function EyeIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a19.74 19.74 0 015.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a19.6 19.6 0 01-3.16 4.19" />
      <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
