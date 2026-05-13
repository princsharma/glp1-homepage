"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./CreateGLP1Plan.module.css";

type Medication = {
  id: string;
  name: string;
  isNew?: boolean;
  benefits: string[];
  description?: string;
  videoSrc: string;
  offLabel?: string;
};

const MEDICATIONS: Medication[] = [
  {
    id: "wegovy-pill",
    name: "Wegovy®",
    isNew: true,
    description: "A once-weekly GLP-1 injection clinically proven for chronic weight management.",
    benefits: ["FDA Approved", "Once-weekly injection"],
    videoSrc: "/images/wegovy-inj.mp4",
  },
  {
    id: "zepbound",
    name: "Zepbound®",
    isNew: true,
    description: "Dual-action GIP/GLP-1 injection helping with appetite regulation and metabolic health.",
    benefits: ["FDA Approved", "Once-weekly injection"],
    videoSrc: "/images/zepbound-inj.mp4",
  },
  {
    id: "ozempic",
    name: "Ozempic®",
    description: "Originally approved for type 2 diabetes, often prescribed off-label for weight loss.",
    benefits: ["FDA Approved", "Once-weekly injection"],
    videoSrc: "/images/ozmepic-inj.mp4",
    offLabel: "Prescribed off-label for weight loss",
  },
  {
    id: "mounjaro",
    name: "Mounjaro®",
    isNew: true,
    description: "A once-weekly injection that targets two key hormones to help reduce hunger and cravings.",
    benefits: ["FDA Approved", "Once-weekly injection"],
    videoSrc: "/images/ozmepic-inj.mp4",
    offLabel: "Prescribed off-label for weight loss",
  },
  {
    id: "rybelsus",
    name: "Rybelsus®",
    description: "The only GLP-1 medication available in tablet form — no injection needed.",
    benefits: ["FDA Approved", "Once-daily tablet"],
    videoSrc: "/images/ryb-tab.mp4",
    offLabel: "Prescribed off-label for weight loss",
  },
  {
    id: "liraglutide",
    name: "Liraglutide",
    description: "A daily GLP-1 injection that helps regulate appetite and support gradual weight loss.",
    benefits: ["FDA Approved", "Once-daily injection"],
    videoSrc: "/images/liraglutide-inj.mp4",
    offLabel: "Prescribed off-label for weight loss under the brand name Victoza®",
  },
];

const CYCLE_DURATION = 6000;

export default function CreateGLP1Plan() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const selected = MEDICATIONS[activeIndex];

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = (elapsed / CYCLE_DURATION) * 100;

      if (newProgress >= 100) {
        setActiveIndex((prev) => (prev + 1) % MEDICATIONS.length);
        startTimeRef.current = Date.now();
        setProgress(0);
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, activeIndex]);

  const handleSelectManual = (index: number) => {
    setActiveIndex(index);
    setProgress(0);
    startTimeRef.current = Date.now();
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <p className={styles.eyebrow}>OUR MEDICATIONS</p>
          <h2 className={styles.heading}>
            Find the right medication for your{" "}
            <span className={styles.headingAccent}>weight management</span>
          </h2>
          <p className={styles.subcopy}>
            Our providers may prescribe from one of six GLP-1 options
            depending on medical necessity and your health needs.
          </p>
        </header>

        {/* Stage — video LEFT, info RIGHT */}
        <div
          className={styles.stage}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Pause hint floats top-right of stage */}
          {/* <span className={styles.pauseHint} aria-hidden="true">
            {isPaused ? "⏸ Paused" : "▶ Auto-playing"}
          </span> */}

          {/* LEFT — Video */}
          <div className={styles.videoFrame}>
            <video
              key={selected.id}
              className={styles.video}
              autoPlay
              muted
              loop
              playsInline
            >
              <source src={selected.videoSrc} type="video/mp4" />
            </video>
          </div>

          {/* RIGHT — Info card */}
          <div key={selected.id + "-info"} className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <h3 className={styles.medName}>{selected.name}</h3>
              {selected.isNew && (
                <span className={styles.newBadge}>NEW</span>
              )}
            </div>

            {selected.description && (
              <p className={styles.medDescription}>{selected.description}</p>
            )}

            <ul className={styles.benefitList}>
              {selected.benefits.map((benefit) => (
                <li key={benefit} className={styles.benefitItem}>
                  <span className={styles.benefitCheck} aria-hidden="true">
                    ✓
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            {selected.offLabel && (
              <p className={styles.offLabelNote}>
                <span className={styles.offLabelIcon} aria-hidden="true">
                  ⓘ
                </span>
                <span>{selected.offLabel}</span>
              </p>
            )}

            <a
              href="/weightloss-onboard"
              className={styles.ctaButton}
              style={{ textDecoration: "none" }}
            >
              Get started with {selected.name}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* Progress bar */}
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Pill navigation */}
        <div className={styles.pillNav} role="tablist">
          {MEDICATIONS.map((med, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={med.id}
                role="tab"
                aria-selected={isActive}
                className={`${styles.pill} ${
                  isActive ? styles.pillActive : ""
                }`}
                onClick={() => handleSelectManual(i)}
              >
                <span className={styles.pillNumber}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.pillName}>{med.name}</span>
                {med.isNew && (
                  <span className={styles.pillNewBadge}>NEW</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Disclaimers */}
        <div className={styles.disclaimers}>
          <p className={styles.disclaimer}>
            <span className={styles.disclaimerLink}>Important:</span>{" "}
            Medications such as Ozempic, Mounjaro, Rybelsus, and Victoza are
            not FDA-approved for weight loss but are often prescribed
            off-label based on medical necessity.
          </p>
          <p className={styles.disclaimerSmall}>
            Your provider may offer compounded medication based on your
            eligibility. However, compounded medications are not FDA-approved.
          </p>
        </div>
      </div>
    </section>
  );
}