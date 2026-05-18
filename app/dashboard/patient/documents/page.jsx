// app/dashboard/patient/documents/page.jsx
//
// Documents — placeholder list of the files captured during onboarding.
// Until file upload is wired (Cloudinary or Firebase Storage), we only have
// the filename strings the form recorded. The page reflects that honestly:
// each known document slot shows the captured filename if any, otherwise an
// empty state. When upload is wired, this page will render thumbnails +
// "View / Download" links.

"use client";

import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import styles from "../dashboard.module.css";

const SLOTS = [
  {
    key: "photoIdName",
    title: "Government-issued ID",
    description: "Used to verify your identity before prescribing.",
  },
  {
    key: "vialPhotoName",
    title: "GLP-1 vial photo",
    description:
      "Reference photo of your current medication, if you submitted one.",
  },
];

export default function PatientDocuments() {
  const { profile } = useAuthUser();
  const onb = profile?.onboarding || {};

  const present = SLOTS.filter((s) => onb[s.key]);
  const missing = SLOTS.filter((s) => !onb[s.key]);

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Patient · Documents</div>
          <h1 className={styles.pageTitle}>Documents</h1>
          <p className={styles.pageSubtitle}>
            Files you submitted during onboarding. Only your care team can see
            these.
          </p>
        </div>
      </header>

      {present.length > 0 && (
        <div className={styles.stack} style={{ marginBottom: 16 }}>
          {present.map((s) => (
            <section key={s.key} className={styles.card}>
              <div className={styles.cardEyebrow}>{s.title}</div>
              <h2 className={styles.cardTitle}>{onb[s.key]}</h2>
              <p
                style={{
                  margin: "6px 0 0",
                  color: "var(--color-text-muted)",
                  fontSize: 14,
                }}
              >
                {s.description}
              </p>
              <p
                style={{
                  margin: "12px 0 0",
                  color: "var(--color-text-soft)",
                  fontSize: 12,
                  fontStyle: "italic",
                }}
              >
                Preview &amp; download coming soon — your file is stored
                securely.
              </p>
            </section>
          ))}
        </div>
      )}

      {missing.length > 0 && (
        <section className={styles.card}>
          <div className={styles.cardEyebrow}>Missing</div>
          <h2 className={styles.cardTitle}>You haven&apos;t uploaded these yet</h2>
          <div
            className={styles.stack}
            style={{ marginTop: 12, gap: 12 }}
          >
            {missing.map((s) => (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  background: "var(--color-bg)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{s.title}</div>
                  <div
                    style={{
                      color: "var(--color-text-muted)",
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    {s.description}
                  </div>
                </div>
                <Link
                  href="/weightloss-onboard"
                  className={styles.ctaSecondary}
                >
                  Upload
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {present.length === 0 && missing.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📄</div>
          <div className={styles.emptyTitle}>No documents yet</div>
          <div className={styles.emptyBody}>
            Once you complete onboarding, your uploaded documents will appear
            here.
          </div>
        </div>
      )}
    </>
  );
}
