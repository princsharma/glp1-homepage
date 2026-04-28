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
    title: "Clinically proven weight loss",
    description:
      "Weight loss medication often contains semaglutide, which mimics a natural hormone that signals fullness to your brain and slows digestion.",
  },
  {
    id: "biological",
    title: "Breakthrough biological barriers",
    description:
      "Weight loss isn't just about diet and exercise — biology, age, hormones, and health conditions all play a role.",
  },
  {
    id: "beyond",
    title: "More benefits beyond weight loss",
    description:
      "GLP-1 drugs can also improve energy levels and lower your risk for heart disease and diabetes.",
  },
];

const FEATURES = [
  { icon: "🧪", label: "No blood test\nor lab work" },
  { icon: "👨‍⚕️", label: "Prescribed by\nlicensed doctors" },
  { icon: "🚚", label: "Free delivery\nto your door" },
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
                  src="/images/dr-vanessa-niles.webp"
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
            </div>
          </div>

          {/* RIGHT — Content */}
          <div className={styles.content}>
            <h2 className={styles.heading}>
              Lose weight with{" "}
              <span className={styles.headingAccent}>GLP-1 drugs</span>
            </h2>

            <p className={styles.subcopy}>
              Weight loss medication, including GLP-1 drugs like{" "}
              <span className={styles.highlight}>Ozempic®</span>,{" "}
              <span className={styles.highlight}>Wegovy®</span>,{" "}
              <span className={styles.highlight}>Mounjaro</span>, and{" "}
              <span className={styles.highlight}>Zepbound®</span> are clinically
              proven to help people lose weight.
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
                Get my eligibility check
                <span className={styles.ctaArrow}>→</span>
              </button>

              <div className={styles.miniStats}>
                <div className={styles.miniStatItem}>
                  <span className={styles.miniStatValue}>100K+</span>
                  <span className={styles.miniStatLabel}>Members</span>
                </div>
                <div className={styles.miniStatDivider} />
                <div className={styles.miniStatItem}>
                  <span className={styles.miniStatValue}>92%</span>
                  <span className={styles.miniStatLabel}>Success rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}