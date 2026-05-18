"use client";

import { useState } from "react";
import styles from "./Pricing.module.css";

const PLANS = [
  { id: "1m", duration: "1 month", months: 1, basePrice: 69, originalPrice: 79 },
  { id: "3m", duration: "3 months", months: 3, basePrice: 219, originalPrice: 240 },
  { id: "12m", duration: "6 months", months: 6, basePrice: 499, originalPrice: 525 },
];

const FEATURES = [
  "Access to evaluations from licensed doctors",
  "Access to nutrition coaching sessions",
  "Prescription approval and medication access",
  "24/7 care team availability",
];

const MEDICATIONS = [
  {
    name: "Semaglutide ",
    price: "+ $299/mo",
    icon: "💊",
  },
  {
    name: "Tirzepatide",
    price: "+ $399/mo",
    icon: "💊",
  },

  {
    name: "Liraglutide",
    price: "Varies",
    icon: "💊",
  },
];

export default function Pricing() {
  const [selectedId, setSelectedId] = useState("1m");
  const selected = PLANS.find((p) => p.id === selectedId);
  const savings = selected.originalPrice - selected.basePrice;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* LEFT — Copy */}
          <div className={styles.content}>
            <p className={styles.eyebrow}>Program Pricing Overview</p>
            <h2 className={styles.heading}>
              What&apos;s included in your{" "}
              <span className={styles.headingAccent}>
                weight loss membership
              </span>
            </h2>
            <p className={styles.subcopy}>
             We offer clear and transparent pricing for our program. This reflects our belief that each patient deserves healthcare access at an affordable range.
            </p>

            <div className={styles.trustList}>
              <div className={styles.trustItem}>
                <span className={styles.trustValue}>5000+</span>
                <span className={styles.trustText}>Members</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustValue}>$0</span>
                <span className={styles.trustText}>Initial Call</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustValue}>24/7</span>
                <span className={styles.trustText}>Availability</span>
              </div>
            </div>

            <div className={styles.disclaimer}>
              <span className={styles.disclaimerIcon} aria-hidden="true">ℹ</span>
              <div className={styles.disclaimerBody}>
                <span className={styles.disclaimerTitle}>Pricing note</span>
                <p className={styles.disclaimerText}>
                  Displayed pricing applies to compounded medications. Brand-name options and final costs may vary based on your prescription, dosage, and pharmacy.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — Pricing card */}
          <div className={styles.card}>
            {/* Toggle pill */}
            <div className={styles.toggle} role="tablist">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedId === plan.id}
                  className={`${styles.toggleBtn} ${
                    selectedId === plan.id ? styles.toggleBtnActive : ""
                  }`}
                  onClick={() => setSelectedId(plan.id)}
                >
                  {plan.duration}
                </button>
              ))}
            </div>

            {/* Price block */}
            <div className={styles.priceRow}>
              <div className={styles.priceLeft}>
                <span className={styles.priceOriginal}>
                  ${selected.originalPrice}/mo
                </span>
                <div className={styles.priceCurrent}>
                  <span
                    key={selected.id}
                    className={styles.priceValue}
                  >
                    ${selected.basePrice}
                  </span>
                  <span className={styles.priceUnit}>/mo</span>
                </div>
              </div>
              <span className={styles.saveBadge}>
                Save ${savings}
              </span>
            </div>

            {/* Features */}
            <ul className={styles.features}>
              {FEATURES.map((f, i) => (
                <li key={i} className={styles.featureItem}>
                  <span className={styles.featureCheck} aria-hidden="true">
                    ✓
                  </span>
                  <span className={styles.featureText}>{f}</span>
                </li>
              ))}
            </ul>

            {/* Medication options */}
            <div className={styles.medications}>
              <h3 className={styles.medicationsTitle}>Medication options</h3>
              <ul className={styles.medList}>
                {MEDICATIONS.map((m, i) => (
                  <li key={i} className={styles.medItem}>
                    <div className={styles.medLeft}>
                      <span className={styles.medIcon} aria-hidden="true">
                        {m.icon}
                      </span>
                      <span className={styles.medName}>{m.name}</span>
                    </div>
                    {m.price && (
                      <span className={styles.medPrice}>{m.price}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <a
              href="/weightloss-onboard"
              className={styles.cta}
              style={{ textDecoration: "none" }}
            >
              Start My Medical Evaluation at $69
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
