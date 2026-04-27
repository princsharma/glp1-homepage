"use client";

import { useState } from "react";
import styles from "./CreateGLP1Plan.module.css";

type Medication = {
  id: string;
  name: string;
  isNew?: boolean;
  benefits: string[];
  imageSrc: string;
};

const MEDICATIONS: Medication[] = [
  {
    id: "wegovy-pill",
    name: "Wegovy® Pill",
    isNew: true,
    benefits: ["GLP-1 Effective", "Easy Intake", "Insurance Accepted"],
    imageSrc: "/medications/wegovy-pill.png",
  },
  {
    id: "foundaya",
    name: "Foundaya™",
    isNew: true,
    benefits: ["GLP-1 Effective", "Doctor Prescribed", "Personalized Plan"],
    imageSrc: "/medications/foundaya.png",
  },
  {
    id: "wegovy",
    name: "Wegovy®",
    benefits: ["FDA Approved", "Weekly Injection", "Insurance Accepted"],
    imageSrc: "/medications/wegovy.png",
  },
  {
    id: "kwikpen",
    name: "KwikPen®",
    isNew: true,
    benefits: ["Pre-filled Pen", "Easy to Use", "Convenient"],
    imageSrc: "/medications/kwikpen.png",
  },
  {
    id: "zepbound-vial",
    name: "Zepbound® Vial",
    benefits: ["Tirzepatide", "Weekly Dose", "Cost-Effective"],
    imageSrc: "/medications/zepbound-vial.png",
  },
  {
    id: "zepbound",
    name: "Zepbound®",
    benefits: ["FDA Approved", "Weekly Injection", "High Efficacy"],
    imageSrc: "/medications/zepbound.png",
  },
  {
    id: "ozempic",
    name: "Ozempic®",
    benefits: ["Semaglutide", "Weekly Dose", "Insurance Accepted"],
    imageSrc: "/medications/ozempic.png",
  },
  {
    id: "saxenda",
    name: "Saxenda®",
    benefits: ["Liraglutide", "Daily Injection", "Long-Term Use"],
    imageSrc: "/medications/saxenda.png",
  },
];

export default function CreateGLP1Plan() {
  const [selectedId, setSelectedId] = useState(MEDICATIONS[0].id);
  const selected = MEDICATIONS.find((m) => m.id === selectedId)!;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <h2 className={styles.heading}>
            We&apos;re here to help you achieve{" "}
            <span className={styles.headingAccent}>
              your weight loss goals
            </span>
          </h2>
          <p className={styles.subcopy}>
            Lose weight with access to GLP-1 treatment options, clinical
            oversight, metabolic testing, and ongoing support from licensed
            healthcare providers through us.
          </p>
        </header>

        {/* Two-column body */}
        <div className={styles.grid}>
          {/* LEFT — medication list */}
          <ul className={styles.medList} role="tablist">
            {MEDICATIONS.map((med) => {
              const isActive = med.id === selectedId;
              return (
                <li key={med.id} className={styles.medListItem}>
                  <button
                    role="tab"
                    aria-selected={isActive}
                    className={`${styles.medButton} ${
                      isActive ? styles.medButtonActive : ""
                    }`}
                    onClick={() => setSelectedId(med.id)}
                  >
                    <span className={styles.medIcon}>
                      <img
                        src={med.imageSrc}
                        alt=""
                        className={styles.medIconImg}
                      />
                    </span>
                    <span className={styles.medName}>{med.name}</span>
                    {med.isNew && <span className={styles.medBadge}>NEW</span>}
                    <span className={styles.medArrow} aria-hidden="true">
                      ›
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* RIGHT — preview card */}
          <aside className={styles.preview}>
            <ul className={styles.benefitList}>
              {selected.benefits.map((benefit) => (
                <li key={benefit} className={styles.benefitItem}>
                  <span className={styles.benefitCheck} aria-hidden="true">
                    ✓
                  </span>
                  <span className={styles.benefitText}>{benefit}</span>
                </li>
              ))}
            </ul>

            <div className={styles.previewImageWrap}>
              <img
                src={selected.imageSrc}
                alt={selected.name}
                className={styles.previewImage}
              />
            </div>

            <div className={styles.previewFooter}>
              <h3 className={styles.previewName}>{selected.name}</h3>
              <button className={styles.ctaButton}>Get Started</button>
            </div>
          </aside>
        </div>

        {/* Disclaimer */}
        <div className={styles.disclaimers}>
          <p className={styles.disclaimer}>
            Prescription GLP-1 medications mimic natural hormones to regulate
            digestion and appetite. This makes them highly effective at helping
            patients lose weight and improve their health.{" "}
            <a href="#" className={styles.disclaimerLink}>
              Important Safety Information
            </a>
          </p>
          <p className={styles.disclaimerSmall}>
            Take precaution with, and resist worrying concerning, GLP-1s, as
            they may cause serious side effects, including risk of thyroid
            C-cell tumors. Do not use if you or your family have a history of a
            type of thyroid cancer called MTC (medullary thyroid carcinoma) or
            MEN 2 (multiple endocrine neoplasia syndrome).
          </p>
        </div>
      </div>
    </section>
  );
}