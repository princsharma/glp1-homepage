"use client";

import { useState } from "react";
import styles from "./CreateGLP1Plan.module.css";

type Medication = {
  id: string;
  name: string;
  isNew?: boolean;
  benefits: string[];
  imageSrc?: string;
  videoSrc?: string;
};

const MEDICATIONS: Medication[] = [
  {
    id: "wegovy-pill",
    name: "Wegovy®",
    isNew: true,
    benefits: ["FDA Approved", "Dosing : Once-weekly injection"],
    videoSrc: "/images/wegovy-inj.mp4",
  },
  {
    id: "zepbound",
    name: "Zepbound®",
    isNew: true,
    benefits: ["FDA Approved", "Dosing : Once-weekly injection"],
    videoSrc: "/images/zepbound-inj.mp4",
  },
  {
    id: "ozempic",
    name: "Ozempic®",
    benefits: ["FDA Approved", "Dosing : Once-weekly injection"],
    videoSrc: "/images/ozmepic-inj.mp4",
  },
  {
    id: "mounjaro",
    name: "Mounjaro®",
    isNew: true,
    benefits: ["FDA Approved", "Dosing : Once-weekly injection"],
    videoSrc: "/images/ozmepic-inj.mp4",
  },
  {
    id: "rybelsus",
    name: "Rybelsus®",
    benefits: ["FDA Approved", "Dosing : Once-daily tablet"],
    videoSrc: "/images/ryb-tab.mp4",
  },
  {
    id: "liraglutide",
    name: "Liraglutide",
    benefits: ["FDA Approved", "Dosing : Once-daily injection"],
    videoSrc: "/images/liraglutide-inj.mp4",
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
            

          <div className={styles.previewImageWrap}>
  {selected.videoSrc ? (
    <video
      key={selected.id}
      className={styles.previewImage}
      autoPlay
      muted
      loop
      playsInline
    >
      <source src={selected.videoSrc} type="video/mp4" />
    </video>
  ) : (
    <img
      src={selected.imageSrc}
      alt={selected.name}
      className={styles.previewImage}
    />
  )}
</div>
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
            <div className={styles.previewFooter}>
              <h3 className={styles.previewName}>{selected.name}</h3>
              <button className={styles.ctaButton}>Get Started</button>
            </div>
          </aside>
        </div>

        {/* Disclaimer */}
       <div className={styles.disclaimers}>
  <p className={styles.disclaimer}>
    <span className={styles.disclaimerLink}>Important:</span>{" "}
    Medications such as Ozempic, Mounjaro, Rybelsus, and Victoza are not FDA-approved for weight loss but are often prescribed off-label based on medical necessity.
  </p>

  <p className={styles.disclaimerSmall}>
    Your provider may offer compounded medication based on your eligibility. However, compounded medications are not FDA-approved.
  </p>
</div>
      </div>
    </section>
  );
}
