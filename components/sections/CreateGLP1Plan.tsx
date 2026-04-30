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
    name: "Wegovy®",
    isNew: true,
    benefits: ["FDA Approved", "Dosing : Once-weekly injection"],
    imageSrc: "/medications/wegovy-pill.png",
  },
  {
    id: "zepbound",
    name: "Zepbound®",
    isNew: true,
    benefits: ["FDA Approved", "Dosing : Once-weekly injection"],
    imageSrc: "/medications/foundaya.png",
  },
  {
    id: "ozempic",
    name: "Ozempic®",
    benefits: ["FDA Approved", "Dosing : Once-weekly injection"],
    imageSrc: "/medications/wegovy.png",
  },
  {
    id: "mounjaro",
    name: "Mounjaro®",
    isNew: true,
    benefits: ["FDA Approved", "Dosing : Once-weekly injection"],
    imageSrc: "/medications/kwikpen.png",
  },
  {
    id: "rybelsus",
    name: "Rybelsus®",
    benefits: ["FDA Approved", "Dosing : Once-daily tablet"],
    imageSrc: "/medications/zepbound-vial.png",
  },
  {
    id: "liraglutide",
    name: "Liraglutide",
    benefits: ["FDA Approved", "Dosing : Once-daily injection"],
    imageSrc: "/medications/zepbound.png",
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
            Find the right medication for your{" "}
            <span className={styles.headingAccent}>weight management</span>
          </h2>
          <p className={styles.subcopy}>
            Our providers may prescribe from one of the six GLP-1 options
            depending on medical necessity and the patient’s health needs.
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
            GLP-1 medications mimic natural hormones to regulate digestion and
            appetite.Clinical data shows that these medications support weight
            loss when combined with lifestyle changes.{" "}
            <a href="#" className={styles.disclaimerLink}>
              Important Safety Information
            </a>
          </p>
          <p className={styles.disclaimerSmall}>
           Your provider may offer compounded medication based on your eligibility. However, compounded medications are not FDA-approved.

          </p>
        </div>
      </div>
    </section>
  );
}
