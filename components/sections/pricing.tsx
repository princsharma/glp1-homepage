"use client";

import { useState } from "react";
import styles from "./Pricing.module.css";

type Plan = {
  id: string;
  duration: string;
  months: number;
  basePrice: number; // per-month equivalent
  originalPrice: number; // shows as struck-through
};

const PLANS: Plan[] = [
  { id: "1m", duration: "1 month", months: 1, basePrice: 69, originalPrice: 59 },
  { id: "3m", duration: "3 months", months: 3, basePrice: 219, originalPrice: 199 },
  { id: "12m", duration: "6 months", months: 6, basePrice: 499, originalPrice: 419 },
];

const FEATURES = [
  "Unlimited access to a physician & dietitian",
  "Nutrition coaching sessions",
  "Access to weight loss medications and more",
  "24/7 customer support",
];

const MEDICATIONS = [
  {
    name: "Compounded Semaglutide",
    price: "+ $99/mo",
    icon: "💊",
  },
  {
    name: "Compounded Tirzepatide",
    price: "+ $199/mo",
    icon: "💊",
  },
  {
    name: "Treatments across skincare, hair growth, and more",
    price: "",
    icon: "🧴",
  },
];

export default function Pricing() {
  const [selectedId, setSelectedId] = useState<string>("1m");
  const selected = PLANS.find((p) => p.id === selectedId)!;
  const savings = selected.originalPrice - selected.basePrice;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* LEFT — Copy */}
          <div className={styles.content}>
            <p className={styles.eyebrow}>SIMPLE PRICING</p>
            <h2 className={styles.heading}>
              What&apos;s included in your{" "}
              <span className={styles.headingAccent}>
                Care membership
              </span>
            </h2>
            <p className={styles.subcopy}>
              Our membership delivers exceptional value. You get low-cost care
              with a high level of human support — what we believe every
              patient deserves.
            </p>

            <div className={styles.trustList}>
              <div className={styles.trustItem}>
                <span className={styles.trustValue}>100K+</span>
                <span className={styles.trustText}>Members</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustValue}>$0</span>
                <span className={styles.trustText}>Hidden fees</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustValue}>30 day</span>
                <span className={styles.trustText}>Guarantee</span>
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
            <button type="button" className={styles.cta}>
              Am I eligible?
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}