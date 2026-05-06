"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import styles from "./CTAButton.module.css";

const ROTATING_TEXT = "★ MODERN HEALTHCARE · MODERN CARE  ";

export default function CTAButton() {
  const [position, setPosition] = useState(50); // % from left
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    // Clamp between 0 and 100
    setPosition(Math.max(0, Math.min(100, percentage)));
  }, []);

  // Mouse / touch handlers attached at document level so dragging
  // continues even if cursor leaves the container
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      updatePosition(clientX);
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchend", handleEnd);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [updatePosition]);

  const handleStart = (clientX: number) => {
    isDraggingRef.current = true;
    updatePosition(clientX);
  };

  // Keyboard accessibility — arrow keys nudge the slider
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPosition((p) => Math.max(0, p - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPosition((p) => Math.min(100, p + 5));
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>
          Clinicians-Supervised Lifestyle Guidance
        </p>

        <h2 className={styles.heading}>
          A fitness plan designed for
          <br />
          <span className={styles.headingAccent}>long-term success</span>
        </h2>

        <article className={styles.card}>
          {/* Rotating badge */}
          <div className={styles.rotatingBadge} aria-hidden="true">
            <svg viewBox="0 0 200 200" className={styles.rotatingSvg}>
              <defs>
                <path
                  id="circlePath"
                  d="M 100, 100 m -78, 0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0"
                />
              </defs>
              <text className={styles.rotatingText}>
                <textPath href="#circlePath" startOffset="0">
                  {ROTATING_TEXT.repeat(2)}
                </textPath>
              </text>
            </svg>
            <span className={styles.badgeCenter} />
          </div>

          {/* LEFT — Before/After comparison slider */}
          <div
            ref={containerRef}
            className={styles.compareWrap}
            onMouseDown={(e) => handleStart(e.clientX)}
            onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          >
            {/* AFTER image — full width, sits behind */}
            <img
              src="/images/slim-girl.webp"
              alt="After weight loss program"
              className={styles.compareImage}
              draggable={false}
            />

            {/* BEFORE image — clipped to show only LEFT portion */}
            <div
              className={styles.beforeClip}
              style={{ width: `${position}%` }}
            >
              <img
                src="/images/fat-girl.webp"
                alt="Before weight loss program"
                className={styles.compareImage}
                style={{
                  width: `${(100 / position) * 100}%`,
                  maxWidth: "none",
                }}
                draggable={false}
              />
            </div>

            {/* Labels */}
            <span className={styles.labelBefore}>BEFORE</span>
            <span className={styles.labelAfter}>AFTER</span>

            {/* Vertical drag line + handle */}
            <div
              className={styles.divider}
              style={{ left: `${position}%` }}
            >
              <div
                className={styles.handle}
                role="slider"
                aria-label="Compare before and after"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(position)}
                tabIndex={0}
                onKeyDown={handleKeyDown}
              >
                <span className={styles.handleArrow}>‹</span>
                <span className={styles.handleArrow}>›</span>
              </div>
            </div>
          </div>

          {/* RIGHT — content */}
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>
              Lifestyle support
              <br />
              made just for you
            </h3>
            <p className={styles.cardText}>
              We believe that progress over perfection matters. That&apos;s why
              each plan includes nutrition tips and physical activity guidance
              at every step of your journey.
            </p>
            <p className={styles.cardHint}>
              <span className={styles.hintDot} />
              Drag the slider to see real results
            </p>
          </div>
        </article>

        <footer className={styles.footer}>
          <p className={styles.footerText}>
            We&apos;re promoting safe, steady, and sustainable weight loss.
          </p>
          <a href="#details" className={styles.footerLink}>
            We&apos;re here for those who choose progress →
          </a>
        </footer>
      </div>
    </section>
  );
}