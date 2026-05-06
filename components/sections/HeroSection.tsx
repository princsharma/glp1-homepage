"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroSection.module.css";

const cards = [
  { src: "/images/glp-c.jpg", label: "GLP-1 GIP", color: "#9b6dff" },
  { src: "/images/glp-b.jpg", label: "Liraglutide", color: "#2bb8a3" },
  { src: "/images/glp-a.jpg", label: "Tirzepatide", color: "#7c5cd6" },
  { src: "/images/glp-d.jpg", label: "Semaglutide", color: "#e7508f" },
  { src: "/images/glp-e.jpg", label: "GLP-1+", color: "#ee8a4f" },
];

const avatars = [
  "/images/dr-cheryl.webp",
  "/images/dr-krasne.webp",
  "/images/dr-vanessa-niles.webp",
];

const repeatedCards = [...cards, ...cards, ...cards, ...cards];

export default function HeroSection() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const wrap = wrapRef.current;
  const track = trackRef.current;
  if (!wrap || !track) return;

  // Skip 3D rotation on mobile — let CSS marquee handle it flat
  const isMobile = () => window.innerWidth <= 767;

  let rafId: number;

  const update = () => {
    // If we're on mobile, reset transforms and stop the loop
    if (isMobile()) {
      const cards = track.children;
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLElement;
        card.style.transform = "";
      }
      return; // Don't schedule next frame
    }

    const wrapRect = wrap.getBoundingClientRect();
    const wrapCenter = wrapRect.left + wrapRect.width / 2;
    const wrapHalfWidth = wrapRect.width / 2;

    const cards = track.children;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as HTMLElement;
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;

      const distance = (cardCenter - wrapCenter) / wrapHalfWidth;
      const clamped = Math.max(-1.2, Math.min(1.2, distance));

      const rotateY = clamped * -45;
      const translateZ = -Math.abs(clamped) * 100;

      card.style.transform = `rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
    }

    rafId = requestAnimationFrame(update);
  };

  // Re-run when window resizes (handles user rotating phone or resizing browser)
  const handleResize = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(update);
  };

  rafId = requestAnimationFrame(update);
  window.addEventListener("resize", handleResize);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", handleResize);
  };
}, []);

  return (
    <section className={styles.hero}>
      {/* Floating decorative orbs */}
      <span className={`${styles.orb} ${styles.orb_1}`} aria-hidden="true" />
      <span className={`${styles.orb} ${styles.orb_2}`} aria-hidden="true" />
      <span className={`${styles.orb} ${styles.orb_3}`} aria-hidden="true" />
      <span className={`${styles.orb} ${styles.orb_4}`} aria-hidden="true" />

      <div className={styles.container}>
        <div className={styles.content}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            JOIN 5,000+ PATIENTS
          </span>

          <h1 className={styles.heading}>
            SAY GOODBYE TO
            <br />
            <span className={styles.headingItalic}>weight</span> STRUGGLES
          </h1>

          <p className={styles.subcopy}>
            Discover the power of GLP-1 medication. Sustainable weight loss
            doesn&apos;t have to be complicated, confusing, or frustrating.
          </p>

          <div className={styles.actionRow}>
            <button type="button" className={styles.primaryBtn}>
              GET STARTED
              <span className={styles.btnArrow} aria-hidden="true">→</span>
            </button>

            <div className={styles.avatarGroup}>
              <div className={styles.avatarStack}>
                {avatars.map((src, i) => (
                  <span
                    key={i}
                    className={styles.avatar}
                    style={{ backgroundImage: `url(${src})` }}
                  />
                ))}
              </div>
              <div className={styles.avatarText}>
                <span className={styles.avatarCount}>5,000+</span>
                <span className={styles.avatarLabel}>happy patients</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width 3D curved marquee */}
      <div ref={wrapRef} className={styles.marqueeWrap}>
        <div ref={trackRef} className={styles.marqueeTrack}>
          {repeatedCards.map((card, i) => (
            <div key={i} className={styles.cardWrapper}>
              <div
                className={styles.card}
                style={{
                  background: `linear-gradient(135deg, ${card.color}, ${card.color}aa)`,
                }}
              >
                <div className={styles.cardImageWrap}>
                  <img
                    src={card.src}
                    alt={card.label}
                    className={styles.cardImage}
                  />
                </div>
                {/* <div className={styles.cardFooter}>
                  <span className={styles.cardLabel}>{card.label}</span>
                  <span className={styles.cardBadge}>FDA · GLP-1</span>
                </div> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}