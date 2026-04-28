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
      "Weight loss medication often contains semaglutide, which mimics a natural hormone that signals fullness to your brain and slows digestion, helping regulate hunger cues and feeling satisfied with smaller portions.",
  },
  {
    id: "biological",
    title: "Breakthrough biological barriers",
    description:
      "Weight loss isn't just about diet and exercise — factors like biology, age, hormones, and health conditions all play a role. Licensed pharmacists can prescribe treatment to make managing weight easier.",
  },
  {
    id: "beyond",
    title: "More benefits beyond weight loss",
    description:
      "GLP-1 drugs can also improve your energy levels and lower your risk for serious health conditions such as heart disease and diabetes.",
  },
];

const FEATURES = [
  { icon: "🧪", label: "No blood test\nand no lab work" },
  { icon: "👨‍⚕️", label: "Prescribed by\nlicensed doctors" },
  { icon: "🚚", label: "Free delivery\nto your door" },
  { icon: "⏱", label: "Results in\nas little as 8 weeks" },
];

const STATS = [
  { value: "100K+", label: "Members served" },
  { value: "92%", label: "Success rate" },
  { value: "24/7", label: "Care support" },
];

export default function GLP1Education() {
  const [activeBenefit, setActiveBenefit] = useState(BENEFITS[0].id);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Promotional badge */}
        <div className={styles.promoBadge}>
          <span className={styles.promoIcon}>★</span>
          <span>Assessment 40% off — limited time</span>
        </div>

        <div className={styles.grid}>
          {/* LEFT — Visual with floating features */}
          <div className={styles.visual}>
            <div className={styles.imageStack}>
              <div className={styles.imageBackdrop} />
              <div className={styles.imageWrap}>
                <img
                  src="/images/dr-vanessa-niles.webp"
                  alt="Person showing positive weight loss results"
                  className={styles.heroImage}
                />
              </div>

              {/* Floating feature pills */}
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

            {/* Eligibility CTA chip */}
            <button type="button" className={styles.eligibilityChip}>
              <span>Am I eligible for GLP-1 drugs?</span>
              <span className={styles.chipArrow} aria-hidden="true">
                →
              </span>
            </button>

            {/* Stat strip */}
            <div className={styles.statStrip}>
              {STATS.map((stat, i) => (
                <div key={i} className={styles.statItem}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
              ))}
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

            <p className={styles.bodyCopy}>
              These weight loss medications work by acting on the brain to
              reduce hunger and slowing stomach emptying to help you feel full
              longer — all of which support effective and sustainable weight
              loss.
            </p>

            {/* Benefit tabs */}
            <div className={styles.benefitTabs} role="tablist">
              {BENEFITS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={activeBenefit === b.id}
                  className={`${styles.benefitTab} ${
                    activeBenefit === b.id ? styles.benefitTabActive : ""
                  }`}
                  onClick={() => setActiveBenefit(b.id)}
                >
                  <span className={styles.benefitCheck} aria-hidden="true">
                    ✓
                  </span>
                  <div className={styles.benefitTabContent}>
                    <span className={styles.benefitTitle}>{b.title}</span>
                    {activeBenefit === b.id && (
                      <p className={styles.benefitDescription}>
                        {b.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button type="button" className={styles.primaryCta}>
              Get my eligibility check
              <span className={styles.ctaArrow}>→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}