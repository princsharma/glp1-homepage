"use client";

import { useMemo, useState } from "react";
import styles from "./BMICalculator.module.css";

type Unit = "metric" | "imperial";

type Category = {
  label: string;
  range: string;
  min: number;
  max: number;
  tone: "low" | "ok" | "warn" | "high";
};

const CATEGORIES: Category[] = [
  { label: "Under", range: "< 18.5", min: 0, max: 18.5, tone: "low" },
  { label: "Healthy", range: "18.5 – 24.9", min: 18.5, max: 25, tone: "ok" },
  { label: "Over", range: "25 – 29.9", min: 25, max: 30, tone: "warn" },
  { label: "Obese", range: "≥ 30", min: 30, max: 60, tone: "high" },
];

const ELIGIBILITY: Record<Category["tone"], { label: string }> = {
  low: { label: "Not a candidate" },
  ok: { label: "Unlikely to qualify" },
  warn: { label: "May qualify" },
  high: { label: "Likely qualifies" },
};

export default function BMICalculator() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [weightKg, setWeightKg] = useState<number>(70);
  const [heightCm, setHeightCm] = useState<number>(170);
  const [weightLb, setWeightLb] = useState<number>(154);
  const [feet, setFeet] = useState<number>(5);
  const [inches, setInches] = useState<number>(7);

  const bmi = useMemo(() => {
    if (unit === "metric") {
      const m = heightCm / 100;
      if (!m) return 0;
      return weightKg / (m * m);
    } else {
      const totalIn = feet * 12 + inches;
      if (!totalIn) return 0;
      return (weightLb / (totalIn * totalIn)) * 703;
    }
  }, [unit, weightKg, heightCm, weightLb, feet, inches]);

  const category = useMemo(
    () => CATEGORIES.find((c) => bmi >= c.min && bmi < c.max) ?? CATEGORIES[3],
    [bmi]
  );

  const eligibility = ELIGIBILITY[category.tone];

  const angle = useMemo(() => {
    const clamped = Math.min(40, Math.max(10, bmi));
    const t = (clamped - 10) / 30;
    return -120 + t * 240;
  }, [bmi]);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <span className={styles.eyebrow}>BMI ELIGIBILITY</span>

        <div className={styles.grid}>
          <div className={styles.left}>
            <h2 className={styles.heading}>
              Could a GLP-1 be{" "}
              <span className={styles.headingItalic}>right</span> for you?
            </h2>

            <p className={styles.subcopy}>
              Before prescribing any treatment, your provider will review your
              full medical history. BMI is one factor that helps determine
              eligibility for GLP-1 medications.
            </p>

            <div className={styles.unitToggle} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={unit === "metric"}
                className={`${styles.unitBtn} ${
                  unit === "metric" ? styles.unitBtnActive : ""
                }`}
                onClick={() => setUnit("metric")}
              >
                Metric
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={unit === "imperial"}
                className={`${styles.unitBtn} ${
                  unit === "imperial" ? styles.unitBtnActive : ""
                }`}
                onClick={() => setUnit("imperial")}
              >
                Imperial
              </button>
            </div>

            <div className={styles.inputs}>
              {unit === "metric" ? (
                <>
                  <Field
                    label="Weight (kg)"
                    value={weightKg}
                    onChange={setWeightKg}
                  />
                  <Field
                    label="Height (cm)"
                    value={heightCm}
                    onChange={setHeightCm}
                  />
                </>
              ) : (
                <>
                  <Field
                    label="Weight (lbs)"
                    value={weightLb}
                    onChange={setWeightLb}
                  />
                  <Field label="Feet" value={feet} onChange={setFeet} />
                  <Field
                    label="Inches"
                    value={inches}
                    onChange={setInches}
                  />
                </>
              )}
            </div>

            <div
              className={`${styles.resultCard} ${
                styles[`tone_${category.tone}`]
              }`}
            >
              <div className={styles.resultHeader}>
                <span className={styles.resultEyebrow}>Eligibility</span>
                <span className={styles.resultLabel}>{eligibility.label}</span>
              </div>
              <button type="button" className={styles.cta}>
                Start Medical Evaluation →
              </button>
            </div>

            <div className={styles.legend}>
              {CATEGORIES.map((c) => (
                <div
                  key={c.label}
                  className={`${styles.legendItem} ${
                    c.tone === category.tone ? styles.legendItemActive : ""
                  }`}
                >
                  <span className={styles.legendLabel}>{c.label}</span>
                  <span className={styles.legendRange}>{c.range}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.right}>
            <Gauge bmi={bmi} angle={angle} category={category} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        type="number"
        className={styles.fieldInput}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  );
}

function Gauge({
  bmi,
  angle,
  category,
}: {
  bmi: number;
  angle: number;
  category: Category;
}) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 130;
  const tickInner = r - 18;
  const tickOuter = r + 8;

  const polar = (deg: number, radius: number = r) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const start = polar(-120);
  const end = polar(120);
  const arcPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;

  const totalArcLength = (240 / 360) * 2 * Math.PI * r;
  const arcProgress = (angle + 120) / 240;
  const visibleArcLength = totalArcLength * arcProgress;

  const ticks = [];
  for (let deg = -120; deg <= 120; deg += 12) {
    const isMajor = (deg + 120) % 60 === 0;
    const inner = polar(deg, isMajor ? tickInner - 4 : tickInner);
    const outer = polar(deg, tickOuter);
    ticks.push({ inner, outer, isMajor, deg });
  }

  return (
    <div className={styles.gauge}>
      <svg viewBox={`0 0 ${size} ${size}`} className={styles.gaugeSvg}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-primary-light)" />
            <stop offset="100%" stopColor="var(--color-primary-dark)" />
          </linearGradient>
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={tick.isMajor ? 2 : 1}
            strokeLinecap="round"
            opacity={tick.isMajor ? 0.6 : 0.3}
          />
        ))}

        <path
          d={arcPath}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="22"
          strokeLinecap="round"
        />

        <path
          d={arcPath}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="22"
          strokeLinecap="round"
          opacity="0.9"
          filter="url(#gaugeGlow)"
          strokeDasharray={`${visibleArcLength} ${totalArcLength}`}
          className={styles.gaugeArc}
        />

        <g
          className={styles.pointer}
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
          }}
        >
          <circle
            cx={cx}
            cy={cy - r}
            r="14"
            fill="var(--color-accent)"
            opacity="0.25"
          />
          <circle
            cx={cx}
            cy={cy - r}
            r="9"
            fill="var(--color-accent)"
            stroke="var(--color-surface)"
            strokeWidth="3"
          />
        </g>
      </svg>

      <div className={styles.gaugeReadout}>
        <span className={styles.gaugeEyebrow}>YOUR BMI</span>
        <span className={styles.gaugeValue}>
          {bmi > 0 ? bmi.toFixed(1) : "—"}
        </span>
        <span
          className={`${styles.gaugeCategory} ${
            styles[`tone_${category.tone}`]
          }`}
        >
          {category.label}
        </span>
      </div>

      <p className={styles.disclaimer}>
        This tool is for general reference and not a diagnosis. Eligibility is
        determined by a licensed provider based on your individual health
        profile, and a prescription is never guaranteed.
      </p>
    </div>
  );
}