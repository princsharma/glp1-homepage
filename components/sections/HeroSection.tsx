"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import styles from "./HeroSection.module.css";

const cards = [
  { src: "/images/glp-c.webp", label: "GLP-1 GIP", color: "#9b6dff" },
  { src: "/images/glp-b.webp", label: "Liraglutide", color: "#2bb8a3" },
  { src: "/images/glp-a.webp", label: "Tirzepatide", color: "#7c5cd6" },
  { src: "/images/glp-d.webp", label: "Semaglutide", color: "#e7508f" },
  { src: "/images/glp-e.webp", label: "GLP-1+", color: "#ee8a4f" },
];

const avatars = [
  "/images/dr-cheryl.webp",
  "/images/dr-krasne.webp",
  "/images/dr-vanessa-niles.webp",
];

const repeatedCards = [...cards, ...cards, ...cards, ...cards];

// Predefined rain drops — fixed values keep SSR + client render in sync.
// Mix of "pill" drops and round dot drops for variety.
const drops: Array<{
  x: string;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  dot?: boolean;
}> = [
  { x: "4%",  size: 6,  duration: 7.5, delay: 0,    drift: 18 },
  { x: "9%",  size: 5,  duration: 9,   delay: 1.6,  drift: -22, dot: true },
  { x: "14%", size: 7,  duration: 6.5, delay: 3.2,  drift: 12 },
  { x: "19%", size: 4,  duration: 8.5, delay: 0.8,  drift: -10, dot: true },
  { x: "24%", size: 8,  duration: 7,   delay: 2.4,  drift: 26 },
  { x: "29%", size: 5,  duration: 9.5, delay: 4,    drift: -18 },
  { x: "34%", size: 6,  duration: 8,   delay: 1.2,  drift: 14, dot: true },
  { x: "39%", size: 7,  duration: 6.8, delay: 3.6,  drift: -24 },
  { x: "44%", size: 5,  duration: 9.2, delay: 0.4,  drift: 20 },
  { x: "49%", size: 6,  duration: 7.6, delay: 2.8,  drift: -12, dot: true },
  { x: "54%", size: 8,  duration: 6.4, delay: 1.8,  drift: 22 },
  { x: "59%", size: 4,  duration: 9.8, delay: 4.4,  drift: -16, dot: true },
  { x: "64%", size: 7,  duration: 7.2, delay: 0.6,  drift: 18 },
  { x: "69%", size: 5,  duration: 8.4, delay: 3,    drift: -20 },
  { x: "74%", size: 6,  duration: 6.6, delay: 1.4,  drift: 16, dot: true },
  { x: "79%", size: 8,  duration: 9,   delay: 2.2,  drift: -26 },
  { x: "84%", size: 5,  duration: 7.8, delay: 0.2,  drift: 14 },
  { x: "89%", size: 7,  duration: 8.6, delay: 3.4,  drift: -18, dot: true },
  { x: "94%", size: 6,  duration: 6.2, delay: 1,    drift: 22 },
  { x: "97%", size: 4,  duration: 9.4, delay: 4.2,  drift: -14, dot: true },
];

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

      {/* Themed rain — falls behind content, picks up theme colors */}
      <div className={styles.rain} aria-hidden="true">
        {drops.map((d, i) => (
          <span
            key={i}
            className={`${styles.drop} ${d.dot ? styles.dropDot : ""}`}
            style={
              {
                "--x": d.x,
                "--size": `${d.size}px`,
                "--duration": `${d.duration}s`,
                "--delay": `${d.delay}s`,
                "--drift": `${d.drift}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>

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
                <div className={styles.cardFooter}>
                  <span className={styles.cardLabel}>{card.label}</span>
                  <span className={styles.cardBadge}>FDA · GLP-1</span>
                </div> 
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}