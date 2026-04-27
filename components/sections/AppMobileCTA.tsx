"use client";

import { useState, FormEvent } from "react";
import styles from "./AppMobileCTA.module.css";

export default function AppMobileCTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    // Replace with your real API call
    await new Promise((r) => setTimeout(r, 800));
    setStatus("success");
  };

  return (
    <section className={styles.section}>
      {/* Background image — full bleed */}
      <div className={styles.background}>
        <img
          src="/cta/guide-bg.jpg"
          alt=""
          className={styles.backgroundImage}
        />
        <div className={styles.backgroundOverlay} />
      </div>

      {/* Content overlaid on left */}
      <div className={styles.container}>
        <div className={styles.content}>
          <span className={styles.eyebrow}>FREE GUIDE · NO COMMITMENT</span>

          <h2 className={styles.heading}>
            Unlock the <span className={styles.headingItalic}>free</span> Guide
            to Protein for Weight Loss
          </h2>

          <p className={styles.subcopy}>
            Written by board-certified doctors to support your journey.
          </p>

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                className={styles.input}
                aria-label="Email address"
                aria-invalid={status === "error"}
                disabled={status === "submitting" || status === "success"}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={status === "submitting" || status === "success"}
            >
              {status === "submitting"
                ? "Sending..."
                : status === "success"
                  ? "Sent — check your inbox ✓"
                  : "Get the guide"}
            </button>

            {status === "error" && (
              <p className={styles.errorMsg} role="alert">
                Please enter a valid email address.
              </p>
            )}
          </form>

          {/* Trust strip */}
          <div className={styles.trustStrip}>
            <span className={styles.trustDot} />
            <span className={styles.trustText}>
              Joined by 12,000+ readers this month
            </span>
          </div>

          {/* Legal microcopy */}
          <p className={styles.legal}>
            By creating an account using email, I agree to the{" "}
            <a href="#terms" className={styles.legalLink}>
              Terms &amp; Conditions
            </a>
            , and acknowledge the{" "}
            <a href="#privacy" className={styles.legalLink}>
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}