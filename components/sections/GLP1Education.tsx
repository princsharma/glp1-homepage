"use client";

import { useState } from "react";
import styles from "./GLP1Education.module.css";

type Benefit = {
  id: string;
  title: string;
  description: string;
};

const BENEFITS: Benefit[] = [
  {
    id: "proven",
    title: "Personalized vs. Generic Plans",
    description:
      "No one-size-fits-all approach; each plan is tailored to your health.",
  },
  {
    id: "biological",
    title: "Medical Guidance vs. Self-trial",
    description:
      "Receive guidance from licensed doctors, not chatbots, for safe care.",
  },
  {
    id: "beyond",
    title: "Sustainable Results vs. Quick Fixes",
    description:
      "We focus on long-term weight loss, not quick, short-term solutions.",
  },
  {
    id: "support",
    title: "Online Evaluation and Prescription",
    description:
      "No in-person visits required; online evaluations with prescriptions issued when appropriate.",
  },
];

const FEATURES = [
  { icon: "🧪", label: "Rx Based\nMedications" },
  { icon: "👨‍⚕️", label: "HIPAA Compliant\nSystem" },
  { icon: "🚚", label: "Prescribed by\nlicensed doctors" },
  { icon: "📦", label: "Medication delivery\nto your door" },
];

export default function GLP1Education() {
  const [activeBenefit, setActiveBenefit] = useState(BENEFITS[0].id);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* LEFT — Visual with floating features */}
          <div className={styles.visual}>
            {/* Promo badge — now inside left column */}
            <div className={styles.promoBadge}>
              <span className={styles.promoIcon}>★</span>
              <span>Assessment 40% off</span>
            </div>

            <div className={styles.imageStack}>
              <div className={styles.imageBackdrop} />
              <div className={styles.imageWrap}>
                <img
                  src="/images/Gemini_Generated_Image_56dfmw56dfmw56df 1.png"
                  alt="Doctor showing positive results"
                  className={styles.heroImage}
                />
              </div>

              {/* Floating feature pills — only 3 now */}
              <div className={`${styles.featurePill} ${styles.featurePill_1}`}>
                <span className={styles.featureIcon}>{FEATURES[0].icon}</span>
                <span className={styles.featureText}>{FEATURES[0].label}</span>
              </div>
              <div className={`${styles.featurePill} ${styles.featurePill_2}`}>
                <span className={styles.featureIcon}>{FEATURES[1].icon}</span>
                <span className={styles.featureText}>{FEATURES[1].label}</span>
              </div>
              <div className={`${styles.featurePill} ${styles.featurePill_3}`}>
                <span className={styles.featureIcon}>{FEATURES[2].icon}</span>
                <span className={styles.featureText}>{FEATURES[2].label}</span>
              </div>
              <div className={`${styles.featurePill} ${styles.featurePill_4}`}>
                <span className={styles.featureIcon}>{FEATURES[3].icon}</span>
                <span className={styles.featureText}>{FEATURES[3].label}</span>
              </div>
            </div>
          </div>

          {/* RIGHT — Content */}
          <div className={styles.content}>
            <h2 className={styles.heading}>
              Why choose{" "}
              <span className={styles.headingAccent}>Ongo Weight Loss</span>
            </h2>

            <p className={styles.subcopy}>
             Our weight loss program is designed to support your overall health and wellness.
            </p>

            {/* Compact accordion benefits */}
            <div className={styles.benefits} role="tablist">
              {BENEFITS.map((b) => {
                const isActive = activeBenefit === b.id;
                return (
                  <div
                    key={b.id}
                    className={`${styles.benefit} ${
                      isActive ? styles.benefitActive : ""
                    }`}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={styles.benefitTrigger}
                      onClick={() => setActiveBenefit(b.id)}
                    >
                      <span className={styles.benefitCheck} aria-hidden="true">
                        ✓
                      </span>
                      <span className={styles.benefitTitle}>{b.title}</span>
                    </button>
                    <div className={styles.benefitPanel}>
                      <p className={styles.benefitDescription}>
                        {b.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA row */}
            <div className={styles.ctaRow}>
              <button type="button" className={styles.primaryCta}>
               Check Your Eligibility
                <span className={styles.ctaArrow}>→</span>
              </button>

              <div className={styles.miniStats}>
                <div className={styles.miniStatItem}>
                  <span className={styles.miniStatValue}>5000+</span>
                  <span className={styles.miniStatLabel}>Members</span>
                </div>
                <div className={styles.miniStatDivider} />
                <div className={styles.miniStatItem}>
                  <span className={styles.miniStatValue}>100%</span>
                  <span className={styles.miniStatLabel}>Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}