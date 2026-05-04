"use client";

// Reusable presentational pieces used across the onboarding form.
// These are stateless — they receive values and callbacks from the parent.

import type { CSSProperties } from "react";
import {
  MEDICATION_ADDONS,
  PLANS,
  PLAN_BENEFITS,
  type Plan,
} from "./data";
import { formatSavings } from "./utils";

// ─────────────────────────────────────────
//  Radio — single-select list of options
// ─────────────────────────────────────────
type RadioProps = {
  options: readonly string[];
  value: string;
  onSelect: (value: string) => void;
};

export function Radio({ options, value, onSelect }: RadioProps) {
  return (
    <div className="opts">
      {options.map((option) => (
        <div
          key={option}
          className={`opt radio ${value === option ? "sel" : ""}`}
          onClick={() => onSelect(option)}
        >
          <span className="chk" />
          {option}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
//  Multi — multi-select list with checkmarks
// ─────────────────────────────────────────
type MultiProps = {
  options: readonly string[];
  values: string[];
  onToggle: (value: string) => void;
};

export function Multi({ options, values, onToggle }: MultiProps) {
  return (
    <div className="opts">
      {options.map((option) => (
        <div
          key={option}
          className={`opt ${values.includes(option) ? "sel" : ""}`}
          onClick={() => onToggle(option)}
        >
          <span className="chk">✓</span>
          {option}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
//  Select — styled <select> dropdown
// ─────────────────────────────────────────
type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: readonly string[];
  style?: CSSProperties;
};

export function Select({
  value,
  onChange,
  placeholder,
  options,
  style,
}: SelectProps) {
  return (
    <select
      className="inp"
      style={style}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

// ─────────────────────────────────────────
//  BmiGauge — semi-circular progress gauge
// ─────────────────────────────────────────
type BmiGaugeProps = {
  bmi: number | null;
  category: string | null;
};

const GAUGE_CENTER_X = 200;
const GAUGE_CENTER_Y = 200;
const GAUGE_RADIUS = 160;
const GAUGE_BMI_MIN = 15;
const GAUGE_BMI_MAX = 40;
const GAUGE_TICK_COUNT = 14;

export function BmiGauge({ bmi, category }: BmiGaugeProps) {
  const clampedBmi =
    bmi == null
      ? GAUGE_BMI_MIN
      : Math.max(GAUGE_BMI_MIN, Math.min(GAUGE_BMI_MAX, bmi));
  const progress = (clampedBmi - GAUGE_BMI_MIN) / (GAUGE_BMI_MAX - GAUGE_BMI_MIN);
  const arcLength = Math.PI * GAUGE_RADIUS;
  const filledLength = arcLength * progress;
  const markerRotation = progress * 180;

  const ticks = Array.from({ length: GAUGE_TICK_COUNT }, (_, index) => {
    const tickProgress = index / (GAUGE_TICK_COUNT - 1);
    const angle = Math.PI * tickProgress;
    const tickInner = GAUGE_RADIUS + 14;
    const tickOuter = GAUGE_RADIUS + 22;
    return {
      x1: GAUGE_CENTER_X - tickInner * Math.cos(angle),
      y1: GAUGE_CENTER_Y - tickInner * Math.sin(angle),
      x2: GAUGE_CENTER_X - tickOuter * Math.cos(angle),
      y2: GAUGE_CENTER_Y - tickOuter * Math.sin(angle),
    };
  });

  const arcPath = `M ${GAUGE_CENTER_X - GAUGE_RADIUS},${GAUGE_CENTER_Y} A ${GAUGE_RADIUS},${GAUGE_RADIUS} 0 0,1 ${GAUGE_CENTER_X + GAUGE_RADIUS},${GAUGE_CENTER_Y}`;

  return (
    <div className="bmi-gauge-wrap">
      <svg viewBox="0 0 400 240" className="bmi-gauge">
        <path
          d={arcPath}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path
          d={arcPath}
          fill="none"
          stroke="#2D6A4F"
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={arcLength - filledLength}
          style={{
            transition: "stroke-dashoffset .55s cubic-bezier(.22,.61,.36,1)",
            opacity: bmi == null ? 0 : 1,
          }}
        />
        {ticks.map((tick, index) => (
          <line
            key={index}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="2"
          />
        ))}
        <g
          style={{
            transform: `rotate(${markerRotation}deg)`,
            transformOrigin: `${GAUGE_CENTER_X}px ${GAUGE_CENTER_Y}px`,
            transition: "transform .55s cubic-bezier(.22,.61,.36,1)",
            opacity: bmi == null ? 0 : 1,
          }}
        >
          <circle
            cx={GAUGE_CENTER_X - GAUGE_RADIUS}
            cy={GAUGE_CENTER_Y}
            r="10"
            fill="#1a1a1a"
            stroke="#fff"
            strokeWidth="3"
          />
        </g>
      </svg>
      <div className="bmi-gauge-text">
        <div className="bmi-gauge-eyebrow">YOUR BMI</div>
        <div className="bmi-gauge-value">
          {bmi != null ? bmi.toFixed(1) : "—"}
        </div>
        <div className="bmi-gauge-cat">
          {category ? category.toUpperCase() : ""}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  StressSlider — 1–10 slider with Low/Medium/High zone styling
// ─────────────────────────────────────────
type StressSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function StressSlider({ value, onChange }: StressSliderProps) {
  const zone = value <= 3 ? "low" : value <= 7 ? "med" : "high";
  return (
    <div className={`stress-block stress-${zone}`}>
      <div className="stress-row">
        <span className="smin">1</span>
        <div className="stress-track-wrap">
          <input
            type="range"
            min={1}
            max={10}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          <div className="stress-ticks" aria-hidden>
            {Array.from({ length: 10 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        </div>
        <span className="smax">10</span>
        <span className="sv">{value}</span>
      </div>
      <div className="stress-zones">
        <span className={zone === "low" ? "active" : ""}>Low</span>
        <span className={zone === "med" ? "active" : ""}>Medium</span>
        <span className={zone === "high" ? "active" : ""}>High</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  PlanCard — plan tabs + price + benefits + medication add-ons
//  (Used on the sPlan screen.)
// ─────────────────────────────────────────
type PlanCardProps = {
  selectedPlanId: string;
  onSelectPlan: (planId: Plan["id"]) => void;
};

export function PlanCard({ selectedPlanId, onSelectPlan }: PlanCardProps) {
  const activePlan = PLANS.find((plan) => plan.id === selectedPlanId) ?? PLANS[0];

  return (
    <div className="plan-card">
      <div className="plan-tabs">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className={`plan-tab ${activePlan.id === plan.id ? "active" : ""}`}
            onClick={() => onSelectPlan(plan.id)}
          >
            {plan.label}
          </button>
        ))}
      </div>

      <div className="plan-price-row">
        <div className="plan-price-col">
          <div className="plan-old">${activePlan.oldMonthly}/mo</div>
          <div className="plan-new">
            <span className="plan-new-amt">${activePlan.monthly}</span>
            <span className="plan-new-suffix">/mo</span>
          </div>
        </div>
        <div className="plan-save">{formatSavings(activePlan.save)}</div>
      </div>

      <ul className="plan-bullets">
        {PLAN_BENEFITS.map((benefit) => (
          <li key={benefit}>
            <span className="plan-tick">✓</span>
            {benefit}
          </li>
        ))}
      </ul>

      <div className="plan-divider" />

      <div className="plan-meds-title">Medication options</div>
      <div className="plan-meds">
        {MEDICATION_ADDONS.map((medication) => (
          <div key={medication.label} className="plan-med-row">
            <span
              className={`plan-med-icon ${medication.pill ? "pill" : "skin"}`}
              aria-hidden
            >
              {medication.pill ? "💊" : "🧴"}
            </span>
            <span className="plan-med-label">{medication.label}</span>
            {medication.price && (
              <span className="plan-med-price">{medication.price}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
