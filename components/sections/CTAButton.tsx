"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import styles from "./CTAButton.module.css";

const ROTATING_TEXT = "★ MODERN HEALTHCARE · MODERN CARE  ";

export default function CTAButton() {
  const [position, setPosition] = useState(0); // 0 = full BEFORE, 100 = full AFTER
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showAutoDemo, setShowAutoDemo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, percentage)));
  }, []);

  // Auto-demo when section comes into viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !showAutoDemo) {
          setShowAutoDemo(true);

          // Demo: 0 → 100 → 0 → 50 (full BEFORE → full AFTER → BEFORE → middle blend)
         const sequence = [
  { pos: 100, delay: 1000 },  // 1s pause showing fat → fade to slim
  { pos: 0, delay: 2500 },    // 1.5s on slim → fade back to fat
  // { pos: 100, delay: 4000 },  // again to slim
  // { pos: 0, delay: 5500 },    // settle at fat
];
          sequence.forEach(({ pos, delay }) => {
            setTimeout(() => {
              if (!isDraggingRef.current && !hasInteracted) {
                setPosition(pos);
              }
            }, delay);
          });

          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [showAutoDemo, hasInteracted]);

  // Document-level drag handlers
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      updatePosition(clientX);
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove, { passive: false });
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
    setIsDragging(true);
    setHasInteracted(true);
    updatePosition(clientX);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    setHasInteracted(true);
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPosition((p) => Math.max(0, p - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPosition((p) => Math.min(100, p + 5));
    }
  };

  const sliderTransition =
    showAutoDemo && !hasInteracted && !isDragging
      ? "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
      : isDragging
      ? "none"
      : "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)";

  // Calculate which label to highlight based on position
  const showingMostlyAfter = position > 50;
  const showingMostlyBefore = position < 50;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>
          Clinicians-Supervised Lifestyle Guidance
        </p>

        <h2 className={styles.heading}>
          A personalized plan designed for
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

          {/* LEFT — Crossfade comparison */}
          <div
            ref={containerRef}
            className={`${styles.compareWrap} ${
              isDragging ? styles.compareWrap_active : ""
            }`}
          >
            {/* BASE LAYER — fat girl (BEFORE) always at full opacity */}
            <img
              src="/images/healthy.webp"
              alt="Before weight loss program"
              className={`${styles.compareImage} ${styles.beforeImage}`}
              draggable={false}
            />

            {/* OVERLAY LAYER — slim girl (AFTER) opacity controlled by slider */}
            <img
              src="/images/slimmer.webp"
              alt="After weight loss program"
              className={`${styles.compareImage} ${styles.afterImage}`}
              style={{
                opacity: position / 100,
                transition: sliderTransition,
              }}
              draggable={false}
            />

            {/* Labels with dynamic emphasis */}
            <span
              className={`${styles.labelBefore} ${
                showingMostlyBefore ? styles.labelBright : styles.labelDim
              }`}
            >
              BEFORE
            </span>
            <span
              className={`${styles.labelAfter} ${
                showingMostlyAfter ? styles.labelBright : styles.labelDim
              }`}
            >
              AFTER
            </span>

            {/* Bottom transformation track + handle */}
            <div
              className={styles.sliderTrack}
              onMouseDown={(e) => handleStart(e.clientX)}
              onTouchStart={(e) => handleStart(e.touches[0].clientX)}
            >
              {/* Filled portion of track */}
              <div
                className={styles.sliderFill}
                style={{
                  width: `${position}%`,
                  transition: sliderTransition,
                }}
              />

              {/* Drag handle */}
              <div
                className={`${styles.handle} ${
                  isDragging ? styles.handleActive : ""
                } ${!hasInteracted ? styles.handlePulsing : ""}`}
                style={{
                  left: `${position}%`,
                  transition: sliderTransition,
                }}
                role="slider"
                aria-label="Compare before and after"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(position)}
                tabIndex={0}
                onKeyDown={handleKeyDown}
              >
                <span className={styles.handleArrow}>‹</span>
                <span className={styles.handleGrip}>
                  <span className={styles.gripDot} />
                  <span className={styles.gripDot} />
                  <span className={styles.gripDot} />
                </span>
                <span className={styles.handleArrow}>›</span>
              </div>

              {/* Track labels */}
              <span className={styles.trackLabelLeft}>BEFORE</span>
              <span className={styles.trackLabelRight}>AFTER</span>
            </div>

            {/* "Drag me" tooltip — disappears once user interacts */}
            {!hasInteracted && (
              <div className={styles.dragTooltip} aria-hidden="true">
                <span className={styles.dragTooltipText}>
                  Drag to see her transformation
                </span>
                <span className={styles.dragTooltipArrow}>→</span>
              </div>
            )}

            {/* Position % indicator */}
            <div className={styles.positionIndicator}>
              <span className={styles.positionLabel}>
                {Math.round(position)}% transformed
              </span>
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

            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>-29.3 lbs</span>
                <span className={styles.statLabel}>Avg loss in 6 months</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statValue}>92%</span>
                <span className={styles.statLabel}>See visible results</span>
              </div>
            </div>

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