"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./wlf.css";
import StripePayment from "./StripePayment";
import { BmiGauge, Multi, PlanCard, Radio, Select, StressSlider } from "./components";
import {
  bmiCategory,
  bmiInputError,
  buildSurgeryListText,
  calculateBmi,
  eligibilityText,
  isValidEmail,
  isValidName,
  isValidPhone,
} from "./utils";
import {
  type Form,
  type ScreenId,
  initialForm,
  noBackScreens,
} from "./schema";
import { submitToMautic } from "./mautic";
import {
  ALCOHOL_FREQUENCY,
  BARIATRIC_PROCEDURES,
  ETHNICITIES,
  EXERCISE_DAYS,
  FAST_FOOD_PER_WEEK,
  GLP_EXPERIENCE,
  GLP_MEDICATIONS,
  INSPIRATIONS,
  MEALS_PER_DAY,
  MEDICATION_DOSES,
  NO_YES,
  NO_YES_UNSURE,
  OTHER_CONDITIONS,
  PAST_METHODS,
  PLANS,
  RECREATIONAL_DRUGS,
  SAFETY_TREATMENTS,
  SEX_OPTIONS,
  SLEEP_HOURS,
  SLOTS,
  STRUGGLE_DURATIONS,
  SUGARY_DRINKS_PER_WEEK,
  type GlpMedication,
  WATER_INTAKE,
  WEIGHT_DIAGNOSES,
  YES_NO,
} from "./data";
import ThemeSwitcher from "@/components/ThemeSwitcher";

// BMI categories shown as a row of cards on the BMI screen.
const BMI_CATEGORY_CARDS = [
  { key: "under", name: "UNDER", range: "< 18.5" },
  { key: "healthy", name: "HEALTHY", range: "18.5 — 24.9" },
  { key: "over", name: "OVER", range: "25 — 29.9" },
  { key: "obese", name: "OBESE", range: "≥ 30" },
] as const;

// Weight goal options shown on the welcome screen with a friendly description.
// The `value` must match the strings in WEIGHT_GOALS so form.s1 stays compatible
// with the existing schema and Mautic mapping.
const WEIGHT_GOAL_CARDS = [
  { value: "1–15 lbs.", desc: "Slim down. Tone up. Stay on track." },
  { value: "16–50 lbs.", desc: "Lose weight & keep it off — no more yo-yo cycles." },
  { value: "50+ lbs.", desc: "Bigger goal? We'll match you with the right plan." },
  { value: "I’m not sure yet", desc: "That's okay — we'll help you figure it out." },
] as const;

// Section metadata — drives the prominent section badge so each chapter feels
// distinct. The badge appears on the FIRST screen of each section.
type SectionKey =
  | "weight"
  | "meds"
  | "id"
  | "bariatric"
  | "medical"
  | "safety"
  | "lifestyle"
  | "profile";

// The eight chapters shown in the persistent stepper at the top of every
// in-section screen. Order matters — this is what users see left-to-right.
const SECTIONS_ORDER: SectionKey[] = [
  "weight", "meds", "id", "bariatric",
  "medical", "safety", "lifestyle", "profile",
];

const SECTION_INFO: Record<SectionKey, { label: string; short: string }> = {
  weight:    { label: "Weight history",    short: "Weight" },
  meds:      { label: "Medication history", short: "Meds" },
  id:        { label: "Identity",           short: "ID" },
  bariatric: { label: "Surgical history",   short: "Surgery" },
  medical:   { label: "Medical history",    short: "Medical" },
  safety:    { label: "Safety screening",   short: "Safety" },
  lifestyle: { label: "Lifestyle",          short: "Lifestyle" },
  profile:   { label: "Almost done",        short: "Wrap-up" },
};

// Maps each in-flow screen to its section + position within the section.
// Schedule (s23) is folded into "profile" so we keep a tidy 8 sections.
const SECTION_SCREENS: Record<SectionKey, ScreenId[]> = {
  weight:    ["s4", "s5", "s6"],
  meds:      ["s7", "s7m", "s7b", "s7a", "s7c", "s7d"],
  id:        ["s7e"],
  bariatric: ["s9", "s9b"],
  medical:   ["s10", "s11"],
  safety:    ["s12", "s13", "s13a", "s14", "s14b", "s15"],
  lifestyle: ["s16", "s17", "s18"],
  profile:   ["s19", "s21", "s22", "s23"],
};

// Reverse map: any screen → its section. Built once at module load.
const SCREEN_TO_SECTION: Partial<Record<ScreenId, SectionKey>> = (() => {
  const map: Partial<Record<ScreenId, SectionKey>> = {};
  (Object.keys(SECTION_SCREENS) as SectionKey[]).forEach((section) => {
    SECTION_SCREENS[section].forEach((screenId) => {
      map[screenId] = section;
    });
  });
  return map;
})();

// Drives the header progress bar — order matters.
// dHard / iThanks intentionally omitted (off-flow ends).
const PROGRESS_ORDER: ScreenId[] = [
  "s1", "s2", "s3", "iGood", "s20", "iRoad",
  "s4", "s5", "s6",
  "s7", "s7m", "s7b", "s7a", "s7c", "s7d", "s7e",
  "s9", "s9b",
  "s10", "s11",
  "s12", "s13", "s13a", "s14", "s14b", "s15",
  "s16", "s17", "s18",
  "s19", "s21", "s22", "s23",
  "sPlan", "sPay", "iConfirm",
];

export default function WeightlossOnboardForm() {
  // ───────────────────────────────────
  //  State + navigation
  // ───────────────────────────────────
  const [screen, setScreen] = useState<ScreenId>("s1");
  const [form, setForm] = useState<Form>(initialForm);
  const screenHistory = useRef<ScreenId[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Header progress (% complete based on PROGRESS_ORDER above).
  const progressPercent = (() => {
    if (screen === "dHard" || screen === "iThanks") return 0;
    const idx = PROGRESS_ORDER.indexOf(screen);
    if (idx === -1) return 0;
    return Math.round(((idx + 1) / PROGRESS_ORDER.length) * 100);
  })();

  const goTo = (next: ScreenId) => {
    screenHistory.current.push(screen);
    setScreen(next);
  };

  const back = () => {
    const previous = screenHistory.current.pop();
    if (previous) setScreen(previous);
  };

  // Reset scroll on every screen change.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [screen]);

  // Mautic submissions fire at exactly two points: when the email is captured
  // on s20 (creates the contact), and when the journey ends — whether that is
  // iConfirm (paid), iThanks (disqualified), or any other terminal screen.
  const submitMauticOnEmailCapture = () => submitToMautic(form, "s20");
  const submitMauticOnComplete = (overrides: Partial<Form>, step: ScreenId) =>
    submitToMautic({ ...form, ...overrides }, step);

  // ───────────────────────────────────
  //  Form mutators
  // ───────────────────────────────────
  // Set a single field by key.
  const updateField = <K extends keyof Form>(field: K, value: Form[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Toggle a value in an array-typed field.
  const toggleValue = <K extends keyof Form>(field: K, value: string) =>
    setForm((prev) => {
      const current = prev[field] as string[];
      const next = current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value];
      return { ...prev, [field]: next as Form[K] };
    });

  // Toggle a value, but treat `noneValue` as exclusive of every other value.
  // Selecting None clears others; selecting another clears None.
  const toggleWithNone = <K extends keyof Form>(
    field: K,
    value: string,
    noneValue: string,
  ) =>
    setForm((prev) => {
      const current = prev[field] as string[];
      let next: string[];
      if (value === noneValue) {
        next = current.includes(noneValue) ? [] : [noneValue];
      } else {
        const without = current.filter(
          (entry) => entry !== value && entry !== noneValue,
        );
        next = current.includes(value) ? without : [...without, value];
      }
      return { ...prev, [field]: next as Form[K] };
    });

  // ───────────────────────────────────
  //  BMI calculations + unit toggle
  // ───────────────────────────────────
  const bmi = useMemo(
    () =>
      calculateBmi({
        unit: form.bmiUnit,
        heightFt: form.heightFt,
        heightIn: form.heightIn,
        weightLbs: form.weightLbs,
        heightCm: form.heightCm,
        weightKg: form.weightKg,
      }),
    [
      form.bmiUnit,
      form.heightFt,
      form.heightIn,
      form.weightLbs,
      form.heightCm,
      form.weightKg,
    ],
  );

  const bmiError = useMemo(
    () =>
      bmiInputError({
        unit: form.bmiUnit,
        heightFt: form.heightFt,
        heightIn: form.heightIn,
        weightLbs: form.weightLbs,
        heightCm: form.heightCm,
        weightKg: form.weightKg,
      }),
    [
      form.bmiUnit,
      form.heightFt,
      form.heightIn,
      form.weightLbs,
      form.heightCm,
      form.weightKg,
    ],
  );

  const currentBmiCategory = bmiCategory(bmi);

  // Switching units carries existing values across (kg ↔ lbs, cm ↔ ft/in).
  const setBmiUnit = (next: "metric" | "imperial") => {
    if (next === form.bmiUnit) return;
    setForm((prev) => {
      const updated = { ...prev, bmiUnit: next };
      if (next === "metric") {
        const feet = parseFloat(prev.heightFt) || 0;
        const inches = parseFloat(prev.heightIn) || 0;
        const pounds = parseFloat(prev.weightLbs) || 0;
        if (feet || inches) {
          updated.heightCm = String(Math.round((feet * 12 + inches) * 2.54));
        }
        if (pounds) updated.weightKg = String(Math.round(pounds / 2.20462));
      } else {
        const cm = parseFloat(prev.heightCm) || 0;
        const kg = parseFloat(prev.weightKg) || 0;
        if (cm) {
          const totalInches = cm / 2.54;
          const feet = Math.floor(totalInches / 12);
          updated.heightFt = String(feet);
          updated.heightIn = String(Math.round(totalInches - feet * 12));
        }
        if (kg) updated.weightLbs = String(Math.round(kg * 2.20462));
      }
      return updated;
    });
  };

  // ───────────────────────────────────
  //  Submission + derived state
  // ───────────────────────────────────
  const logSubmission = (next: ScreenId, label: string) => {
    console.log(label, form);
    goTo(next);
  };

  const submit = () =>
    logSubmission("sPlan", "Weight loss onboarding submission");

  const selectedPlan = PLANS.find((plan) => plan.id === form.plan);

  // HIPAA (consentH) is required; Telehealth/Terms (consentT) is optional.
  const emailScreenIsValid = isValidEmail(form.email) && form.consentH;

  const profileScreenIsValid =
    isValidName(form.firstName) &&
    isValidName(form.lastName) &&
    isValidPhone(form.phone);

  // ───────────────────────────────────
  //  Render
  // ───────────────────────────────────
  return (
    <div className="wlf-root">
      <div className="wlf-page">
        <div className="fw" ref={scrollRef}>
          {/* Header (logo, back button, contact link) */}
          <div className="hdr">
            <button
              type="button"
              className={`back-btn ${noBackScreens.has(screen) ? "hide" : ""}`}
              onClick={back}
              aria-label="Go back"
            >
              ← Back
            </button>
            <div className="logo">
              <em>Ongo</em> Weight Loss
            </div>
            <a className="contact-link" href="tel:+18885550123">
              <span className="contact-icon" aria-hidden>📞</span>
              <span className="contact-num">1 (888) 555-0123</span>
            </a>
          </div>

          {/* Top progress bar — only shows on screens WITHOUT the section
              stepper (welcome, BMI, email, interstitials, plan/pay).
              In-section screens get the dedicated stepper instead. */}
          {progressPercent > 0 && !SCREEN_TO_SECTION[screen] && (
            <div
              className="progress-bar"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Form completion progress"
            >
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Persistent section stepper — shown on every in-section screen so
              the user always knows which chapter they're in and how far through.
              Skipped on welcome (s1, s2), email (s20), BMI (s3), interstitials,
              plan/pay, and end states. */}
          {SCREEN_TO_SECTION[screen] && (
            <SectionStepper
              section={SCREEN_TO_SECTION[screen]!}
              currentScreen={screen}
            />
          )}

          {/* ════════════════════════════════════════════
              GOALS & INSPIRATION (s1, s2)
              Welcome hero layout — image-led, editorial title,
              then a white card with the options.
              ════════════════════════════════════════════ */}
          {screen === "s1" && (
            <div className="welcome">
              <div className="welcome-hero">
                <div className="welcome-hero-text">
                  <span className="welcome-pill">
                    <span className="welcome-pill-dot" />
                    2 minute quiz
                  </span>
                  <h1 className="welcome-title">
                    Let&apos;s <em>personalize</em><br />your treatment
                  </h1>
                  <p className="welcome-sub">
                    Answer a few quick questions to match you with the right plan.
                  </p>
                </div>
                <div className="welcome-hero-art" aria-hidden>
                  <div className="welcome-vial">
                    <div className="welcome-vial-cap" />
                    <div className="welcome-vial-body">
                      <div className="welcome-vial-label">GLP-1</div>
                      <div className="welcome-vial-sub">Compounded</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="welcome-card">
                <div className="welcome-q">How much weight would you like to lose?</div>
                <div className="welcome-opts">
                  {WEIGHT_GOAL_CARDS.map((card) => {
                    const isSelected = form.s1 === card.value;
                    return (
                      <button
                        key={card.value}
                        type="button"
                        className={`welcome-opt ${isSelected ? "sel" : ""}`}
                        onClick={() => updateField("s1", card.value)}
                      >
                        <span className="welcome-opt-text">
                          <span className="welcome-opt-title">{card.value}</span>
                          <span className="welcome-opt-desc">{card.desc}</span>
                        </span>
                        <span className="welcome-opt-arrow" aria-hidden>→</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="cta welcome-cta"
                  disabled={!form.s1}
                  onClick={() => goTo("s2")}
                >
                  Continue
                </button>
                <div className="welcome-foot">
                  Already a member? <a href="#">Sign In</a>
                </div>
              </div>
            </div>
          )}

          {screen === "s2" && (
            <div className="welcome">
              <div className="welcome-hero">
                <div className="welcome-hero-text">
                  <span className="welcome-pill">
                    <span className="welcome-pill-dot" />
                    Almost there
                  </span>
                  <h1 className="welcome-title">
                    What&apos;s <em>driving you</em><br />right now?
                  </h1>
                  <p className="welcome-sub">
                    Tell us what matters most so we can tailor your plan.
                  </p>
                </div>
                <div className="welcome-hero-art" aria-hidden>
                  <div className="welcome-vial">
                    <div className="welcome-vial-cap" />
                    <div className="welcome-vial-body">
                      <div className="welcome-vial-label">GLP-1</div>
                      <div className="welcome-vial-sub">Compounded</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="welcome-card">
                <div className="welcome-q">What&apos;s making you want to start now?</div>
                <div className="welcome-q-sub">Select all that apply.</div>
                <Multi
                  options={INSPIRATIONS}
                  values={form.s2}
                  onToggle={(value) => toggleValue("s2", value)}
                />
                <button
                  type="button"
                  className="cta welcome-cta"
                  disabled={form.s2.length === 0}
                  onClick={() => goTo("s20")}
                >
                  Continue
                </button>
                <div className="welcome-foot">
                  Already a member? <a href="#">Sign In</a>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              BMI (s3) → eligibility interstitial (iGood)
              ════════════════════════════════════════════ */}
          {screen === "s3" && (
            <div className="sc bmi-screen">
              <div className="bmi-eyebrow">Step 1 · Eligibility check</div>
              <div className="q bmi-q">Let&apos;s check if GLP-1 is right for you</div>
              <div className="qs bmi-qs">
                Your height and weight help us calculate your BMI — a key factor in eligibility.
              </div>

              <div className="bmi-shell">
                <div className="unit-toggle bmi-toggle">
                  <button
                    type="button"
                    className={form.bmiUnit === "imperial" ? "active" : ""}
                    onClick={() => setBmiUnit("imperial")}
                  >
                    Imperial (ft / lbs)
                  </button>
                  <button
                    type="button"
                    className={form.bmiUnit === "metric" ? "active" : ""}
                    onClick={() => setBmiUnit("metric")}
                  >
                    Metric (cm / kg)
                  </button>
                </div>

                {form.bmiUnit === "metric" ? (
                  <div className="bmi-fields">
                    <div className="bmi-field">
                      <label className="bmi-field-label">Height</label>
                      <div className="bmi-field-input">
                        <input
                          className="inp bmi-inp"
                          type="number"
                          inputMode="numeric"
                          min={61}
                          max={274}
                          placeholder="0"
                          value={form.heightCm}
                          onChange={(event) =>
                            updateField("heightCm", event.target.value)
                          }
                        />
                        <span className="bmi-unit">cm</span>
                      </div>
                    </div>
                    <div className="bmi-field">
                      <label className="bmi-field-label">Weight</label>
                      <div className="bmi-field-input">
                        <input
                          className="inp bmi-inp"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={500}
                          placeholder="0"
                          value={form.weightKg}
                          onChange={(event) =>
                            updateField("weightKg", event.target.value)
                          }
                        />
                        <span className="bmi-unit">kg</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bmi-fields">
                    <div className="bmi-field">
                      <label className="bmi-field-label">Height</label>
                      <div className="bmi-field-pair">
                        <div className="bmi-field-input">
                          <input
                            className="inp bmi-inp"
                            type="number"
                            inputMode="numeric"
                            min={2}
                            max={9}
                            placeholder="0"
                            value={form.heightFt}
                            onChange={(event) =>
                              updateField("heightFt", event.target.value)
                            }
                          />
                          <span className="bmi-unit">ft</span>
                        </div>
                        <div className="bmi-field-input">
                          <input
                            className="inp bmi-inp"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={11}
                            placeholder="0"
                            value={form.heightIn}
                            onChange={(event) =>
                              updateField("heightIn", event.target.value)
                            }
                          />
                          <span className="bmi-unit">in</span>
                        </div>
                      </div>
                    </div>
                    <div className="bmi-field">
                      <label className="bmi-field-label">Weight</label>
                      <div className="bmi-field-input">
                        <input
                          className="inp bmi-inp"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={1100}
                          placeholder="0"
                          value={form.weightLbs}
                          onChange={(event) =>
                            updateField("weightLbs", event.target.value)
                          }
                        />
                        <span className="bmi-unit">lbs</span>
                      </div>
                    </div>
                  </div>
                )}

                {bmiError && <div className="field-err">{bmiError}</div>}

                <div
                  className={`bmi-gauge-shell${
                    currentBmiCategory && !bmiError
                      ? ` bmi-gauge-shell-${currentBmiCategory}`
                      : ""
                  }`}
                >
                  <BmiGauge
                    bmi={bmiError ? null : bmi}
                    category={bmiError ? null : currentBmiCategory}
                  />
                </div>

                {bmi !== null && !bmiError && (
                  <div
                    className={`bmi-pill bmi-pill-center bmi-pill-${currentBmiCategory ?? "none"}`}
                  >
                    {eligibilityText(bmi)}
                  </div>
                )}

                <div className="cat-row">
                  {BMI_CATEGORY_CARDS.map((category) => (
                    <div
                      key={category.key}
                      className={`cat-card cat-card-${category.key} ${currentBmiCategory === category.key ? "active" : ""}`}
                    >
                      <div className="cat-name">{category.name}</div>
                      <div className="cat-range">{category.range}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="cta"
                disabled={bmi === null || bmiError !== null}
                onClick={() => {
                  // BMI < 27 is a hard disqualification. Fire the Mautic
                  // POST with disqualified=yes immediately so the lead is
                  // captured even if the user closes the tab on dHard.
                  if (bmi !== null && bmi < 27) {
                    submitMauticOnComplete({}, "dHard");
                    goTo("dHard");
                  } else {
                    goTo("iGood");
                  }
                }}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "iGood" && (() => {
            // Compute projection inputs from data the user has already entered.
            // (s3 captured current weight, s1 captured target loss range.)
            const currentLbs = getCurrentLbs(form);
            const lossLbs = estimateLossLbs(form, currentLbs);
            const goalLbs = currentLbs - lossLbs;
            const showChart =
              currentLbs > 0 && goalLbs > 0 && goalLbs < currentLbs;

            return (
              <div className="inter inter-good">
                <div className="ibg" />
                <div className="ic center">
                  <div className="ic-body">
                    <div className="ititle">Good news!</div>
                    <div className="ibody">
                      Based on this info, <strong>you may be eligible</strong>{" "}
                      for GLP-1 treatment. Here&apos;s what your journey could
                      look like:
                    </div>

                    {showChart && (
                      <WeightProjection
                        currentLbs={currentLbs}
                        goalLbs={goalLbs}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    className="icta"
                    onClick={() => goTo("iRoad")}
                  >
                    Continue
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ════════════════════════════════════════════
              ROADMAP INTERSTITIAL (iRoad)
              ════════════════════════════════════════════ */}
          {screen === "iRoad" && (
            <div className="inter inter-road">
              <div className="ibg" />
              <div className="ic center">
                <div className="ic-body">
                  {/* Animated hero — 4 milestone dots connected by a path
                      that draws itself, each dot lights up in sequence. */}
                  <div className="ir-hero" aria-hidden>
                    <svg
                      className="ir-hero-svg"
                      viewBox="0 0 380 120"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <linearGradient id="irPath" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="var(--wlf-brand)" />
                          <stop offset="100%" stopColor="var(--wlf-brand-light)" />
                        </linearGradient>
                      </defs>

                      {/* Soft connecting path between milestones */}
                      <path
                        d="M 50 60 C 110 60, 130 60, 160 60 S 230 60, 270 60 S 340 60, 360 60"
                        stroke="var(--wlf-border-strong)"
                        strokeWidth="2"
                        strokeDasharray="3 5"
                        fill="none"
                        strokeLinecap="round"
                      />

                      {/* Animated bright path that draws over the dotted line */}
                      <path
                        className="ir-hero-path"
                        d="M 50 60 C 110 60, 130 60, 160 60 S 230 60, 270 60 S 340 60, 360 60"
                        stroke="url(#irPath)"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                        pathLength={1}
                      />

                      {/* 4 milestone circles */}
                      {[
                        { cx: 50,  delay: "0s",   icon: "♡",  size: 14 },
                        { cx: 153, delay: "0.6s", icon: "✓",  size: 14 },
                        { cx: 256, delay: "1.2s", icon: "📅", size: 12 },
                        { cx: 360, delay: "1.8s", icon: "★",  size: 14 },
                      ].map((m, i) => (
                        <g key={i} className="ir-hero-node" style={{ animationDelay: m.delay }}>
                          {/* Outer halo (animates on activation) */}
                          <circle
                            cx={m.cx} cy="60" r="22"
                            fill="var(--wlf-brand-soft)"
                            className="ir-hero-halo"
                            style={{ animationDelay: m.delay }}
                          />
                          {/* Main milestone bubble */}
                          <circle
                            cx={m.cx} cy="60" r="14"
                            fill="var(--wlf-brand)"
                            stroke="#fff"
                            strokeWidth="2.5"
                            className="ir-hero-dot"
                            style={{ animationDelay: m.delay }}
                          />
                          {/* Icon inside */}
                          <text
                            x={m.cx} y="65"
                            textAnchor="middle"
                            fontSize={m.size}
                            fill="#fff"
                            fontWeight="700"
                            className="ir-hero-icon"
                            style={{ animationDelay: m.delay }}
                          >
                            {m.icon}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>

                  <div className="ititle ir-title">
                    Great! Now a few questions
                  </div>
                  <div className="ibody ir-sub">
                    Here&apos;s what&apos;s next on your journey to a personalised plan.
                  </div>

                  {/* Enhanced 4-step roadmap. Each step has hover lift +
                      icon glow. Active step is highlighted; future steps
                      are softer. */}
                  <div className="ir-steps">
                    <div className="ir-step is-active">
                      <div className="ir-step-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </div>
                      <div className="ir-step-text">
                        <div className="ir-step-row">
                          <span className="ir-step-title">Health questions</span>
                          <span className="ir-step-pill">3–4 min</span>
                        </div>
                        <div className="ir-step-desc">
                          Answer a few questions about your goals and history.
                        </div>
                      </div>
                    </div>

                    <div className="ir-step">
                      <div className="ir-step-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 12l2 2 4-4" />
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      </div>
                      <div className="ir-step-text">
                        <div className="ir-step-row">
                          <span className="ir-step-title">See your match</span>
                          <span className="ir-step-pill ir-step-pill-soft">Instant</span>
                        </div>
                        <div className="ir-step-desc">
                          Get matched with a treatment plan tailored to you.
                        </div>
                      </div>
                    </div>

                    <div className="ir-step">
                      <div className="ir-step-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                      </div>
                      <div className="ir-step-text">
                        <div className="ir-step-row">
                          <span className="ir-step-title">Book consultation</span>
                          <span className="ir-step-pill ir-step-pill-soft">15 min</span>
                        </div>
                        <div className="ir-step-desc">
                          Pick a time that works — meet your physician on video.
                        </div>
                      </div>
                    </div>

                    <div className="ir-step">
                      <div className="ir-step-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </div>
                      <div className="ir-step-text">
                        <div className="ir-step-row">
                          <span className="ir-step-title">Start your plan</span>
                          <span className="ir-step-pill ir-step-pill-soft">2–3 days</span>
                        </div>
                        <div className="ir-step-desc">
                          Receive medication shipped discreetly to your door.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trust row — small reassurance points */}
                  <div className="ir-trust">
                    <div className="ir-trust-item">
                      <span className="ir-trust-icon" aria-hidden>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </span>
                      Licensed physicians
                    </div>
                    <div className="ir-trust-item">
                      <span className="ir-trust-icon" aria-hidden>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      HIPAA secure
                    </div>
                    <div className="ir-trust-item">
                      <span className="ir-trust-icon" aria-hidden>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                      </span>
                      Cancel anytime
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="icta"
                  onClick={() => goTo("s4")}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              WEIGHT HISTORY (s4, s5, s6)
              ════════════════════════════════════════════ */}
          {screen === "s4" && (
            <div className="sc">
              <div className="q">
                Can you share a little about your weight journey so far?
              </div>
              <div className="qs">
                This helps your doctor understand your journey.
              </div>
              <div className="r2">
                <input
                  className="inp"
                  style={{ margin: 0 }}
                  type="number"
                  inputMode="numeric"
                  placeholder="Highest adult weight (lbs)"
                  value={form.wtHigh}
                  onChange={(event) =>
                    updateField("wtHigh", event.target.value)
                  }
                />
                <input
                  className="inp"
                  style={{ margin: 0 }}
                  type="number"
                  inputMode="numeric"
                  placeholder="Lowest weight, past 5 yrs (lbs)"
                  value={form.wtLow}
                  onChange={(event) =>
                    updateField("wtLow", event.target.value)
                  }
                />
              </div>
              <input
                className="inp"
                type="number"
                inputMode="numeric"
                placeholder="Goal weight (lbs)"
                value={form.wtGoal}
                onChange={(event) =>
                  updateField("wtGoal", event.target.value)
                }
              />
              <input
                className="inp"
                type="number"
                inputMode="numeric"
                placeholder="Waist circumference (inches) — optional"
                value={form.waist}
                onChange={(event) => updateField("waist", event.target.value)}
              />
              <button
                type="button"
                className="cta"
                onClick={() => goTo("s5")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s5" && (
            <div className="sc">
              <div className="q">
                How long has your weight been a concern for you?
              </div>
              <Radio
                options={STRUGGLE_DURATIONS}
                value={form.s5}
                onSelect={(value) => updateField("s5", value)}
              />
              <button
                type="button"
                className="cta"
                disabled={!form.s5}
                onClick={() => goTo("s6")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s6" && (
            <div className="sc">
              <div className="q">What have you tried before to lose weight?</div>
              <div className="qs">Select all that apply.</div>
              <Multi
                options={PAST_METHODS}
                values={form.s6}
                onToggle={(value) => toggleValue("s6", value)}
              />
              <button
                type="button"
                className="cta"
                disabled={form.s6.length === 0}
                onClick={() => goTo("s7")}
              >
                Continue
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════
              MEDICATION HISTORY (s7 → s7m → s7b → s7a → s7c → s7d → s7e)
              ════════════════════════════════════════════ */}
          {screen === "s7" && (
            <div className="sc">
              <div className="q">
                Have you taken any GLP-1 medications before or are you taking one now?
              </div>
              <Radio
                options={YES_NO}
                value={form.s7}
                onSelect={(value) => updateField("s7", value)}
              />
              <button
                type="button"
                className="cta"
                disabled={!form.s7}
                onClick={() => goTo(form.s7 === "Yes" ? "s7m" : "s7e")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s7m" && (
            <div className="sc">
              <div className="q">
                Which GLP-1 medication have you used or currently using?
              </div>
              <Radio
                options={GLP_MEDICATIONS}
                value={form.glpMed}
                onSelect={(value) => {
                  // Switching meds wipes the previous dose so it doesn't carry over.
                  if (value !== form.glpMed) updateField("glpDose", "");
                  updateField("glpMed", value);
                }}
              />
              <button
                type="button"
                className="cta"
                disabled={!form.glpMed}
                onClick={() => goTo("s7b")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s7b" && (
            <div className="sc">
              <div className="q">
                What dose of {form.glpMed} are you taking or have you taken?
              </div>
              <Radio
                options={MEDICATION_DOSES[form.glpMed as GlpMedication] ?? []}
                value={form.glpDose}
                onSelect={(value) => updateField("glpDose", value)}
              />
              <div className="qs">
                Please share how many units of medication you are drawing up
                with each injection, and how often you inject.
              </div>
              <textarea
                className="inp"
                placeholder="Please specify"
                value={form.glpDoseDetails ?? ""}
                onChange={(event) =>
                  updateField("glpDoseDetails", event.target.value)
                }
              />
              <button
                type="button"
                className="cta"
                disabled={!form.glpDose}
                onClick={() => goTo("s7a")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s7a" && (
            <div className="sc">
              <div className="q">
                How was your experience with GLP-1 medications?
              </div>
              <Radio
                options={GLP_EXPERIENCE}
                value={form.glpExperience}
                onSelect={(value) => updateField("glpExperience", value)}
              />
              <button
                type="button"
                className="cta"
                disabled={!form.glpExperience}
                onClick={() => goTo("s7c")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s7c" && (
            <div className="sc">
              <div className="q">
                What was the date of your last injection (Month/Day/Year)?
              </div>
              <input
                className="inp"
                type="date"
                value={form.glpLastInjection ?? ""}
                onChange={(event) =>
                  updateField("glpLastInjection", event.target.value)
                }
              />
              <button
                type="button"
                className="cta"
                disabled={!form.glpLastInjection}
                onClick={() => goTo("s7d")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s7d" && (
            <div className="sc">
              <div className="q" style={{ fontSize: 17, fontWeight: 600 }}>
                If you have a photo of your current medication or prescription,
                you can upload it here. Please make sure your name and dosing
                details are visible.
              </div>
              <label className="cta2 upload-btn">
                ⬆ Upload file
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(event) =>
                    updateField(
                      "vialPhotoName",
                      event.target.files?.[0]?.name ?? "",
                    )
                  }
                />
              </label>
              {form.vialPhotoName && (
                <div className="upload-name">✓ {form.vialPhotoName}</div>
              )}
              <button
                type="button"
                className="cta"
                onClick={() => goTo("s7e")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s7e" && (
            <div className="sc">
              <div className="q">Upload your photo ID</div>
              <div className="qs">
                A government-issued ID (driver&apos;s license, passport, or state ID) helps verify your identity.
              </div>

              <div className="id-card">
                <div className="id-card-illus" aria-hidden>
                  <svg viewBox="0 0 64 48" width="56" height="42" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="60" height="44" rx="6" stroke="currentColor" strokeWidth="2.5" />
                    <circle cx="18" cy="22" r="6" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M10 38c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="34" y1="16" x2="56" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="34" y1="24" x2="56" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="34" y1="32" x2="48" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="id-card-tips">
                  <div className="id-tip">
                    <span className="id-tip-icon">✓</span>
                    <span>Clearly shows your entire ID</span>
                  </div>
                  <div className="id-tip">
                    <span className="id-tip-icon">✓</span>
                    <span>Not cropped, blurry, or dark</span>
                  </div>
                  <div className="id-tip">
                    <span className="id-tip-icon">🔒</span>
                    <span>Only your healthcare team will see this</span>
                  </div>
                </div>
              </div>

              {form.photoIdName && (
                <div className="upload-name">✓ {form.photoIdName}</div>
              )}

              <div className="id-actions">
                <label className="cta2 id-btn">
                  📁 Select photo
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(event) =>
                      updateField(
                        "photoIdName",
                        event.target.files?.[0]?.name ?? "",
                      )
                    }
                  />
                </label>
                <label className="cta2 id-btn id-btn-primary">
                  📷 Take photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={(event) =>
                      updateField(
                        "photoIdName",
                        event.target.files?.[0]?.name ?? "",
                      )
                    }
                  />
                </label>
              </div>
              <button
                type="button"
                className="cta"
                disabled={!form.photoIdName}
                onClick={() => goTo("s9")}
              >
                Continue
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════
              BARIATRIC SURGERY HISTORY (s9, s9b)
              ════════════════════════════════════════════ */}
          {screen === "s9" && (
            <div className="sc">
              <div className="q">
                Have you had any weight loss surgery in the past?
              </div>
              <div className="qs">Select all that apply.</div>
              <Multi
                options={BARIATRIC_PROCEDURES}
                values={form.s9}
                onToggle={(value) =>
                  toggleWithNone("s9", value, "None of these")
                }
              />
              <button
                type="button"
                className="cta"
                disabled={form.s9.length === 0}
                onClick={() =>
                  goTo(
                    form.s9.some((procedure) => procedure !== "None of these")
                      ? "s9b"
                      : "s10",
                  )
                }
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s9b" && (
            <BariatricDateScreen
              procedures={form.s9}
              value={form.bariDate ?? ""}
              onChange={(value) => updateField("bariDate", value)}
              onContinue={() => goTo("s10")}
            />
          )}

          {/* ════════════════════════════════════════════
              MEDICAL HISTORY (s10, s11)
              ════════════════════════════════════════════ */}
          {screen === "s10" && (
            <div className="sc">
              <div className="q">
                Have you been diagnosed with any of these health conditions?
              </div>
              <div className="qs">Select all that apply.</div>
              <Multi
                options={WEIGHT_DIAGNOSES}
                values={form.s10}
                onToggle={(value) =>
                  toggleWithNone("s10", value, "None of the above")
                }
              />
              <button
                type="button"
                className="cta"
                disabled={form.s10.length === 0}
                onClick={() => goTo("s11")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s11" && (
            <div className="sc">
              <div className="q">
                Do you have any other health conditions we should know about?
              </div>
              <div className="qs">Select all that apply.</div>
              <Multi
                options={OTHER_CONDITIONS}
                values={form.s11}
                onToggle={(value) => toggleWithNone("s11", value, "None")}
              />
              <input
                className="inp"
                type="text"
                placeholder="Any other conditions? (optional)"
                value={form.s11Other}
                onChange={(event) =>
                  updateField("s11Other", event.target.value)
                }
              />
              <button
                type="button"
                className="cta"
                disabled={form.s11.length === 0}
                onClick={() => goTo("s12")}
              >
                Continue
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════
              SAFETY SCREENING (s12, s13, s13a, s14, s14b, s15)
              ════════════════════════════════════════════ */}
          {screen === "s12" && (
            <div className="sc">
              <div className="q">
                Are you currently dealing with any of the following?
              </div>
              <div className="qs">Select all that apply.</div>
              <Multi
                options={SAFETY_TREATMENTS}
                values={form.s12}
                onToggle={(value) => toggleWithNone("s12", value, "None")}
              />
              <button
                type="button"
                className="cta"
                disabled={form.s12.length === 0}
                onClick={() => goTo("s13")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s13" && (
            <div className="sc">
              <div className="q">
                Have you or a close family member had medullary thyroid cancer
                or MEN2 syndrome?
              </div>
              <Radio
                options={NO_YES_UNSURE}
                value={form.s13}
                onSelect={(value) => updateField("s13", value)}
              />
              <button
                type="button"
                className="cta"
                disabled={!form.s13}
                onClick={() => {
                  if (form.s13 === "Yes") {
                    submitMauticOnComplete({}, "dHard");
                    goTo("dHard");
                  } else {
                    goTo("s13a");
                  }
                }}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s13a" && (
            <div className="sc">
              <div className="q">What was your sex assigned at birth?</div>
              <Radio
                options={SEX_OPTIONS}
                value={form.sexAtBirth}
                onSelect={(value) => updateField("sexAtBirth", value)}
              />
              <button
                type="button"
                className="cta"
                disabled={!form.sexAtBirth}
                onClick={() =>
                  // Male skips the pregnancy screen entirely.
                  goTo(form.sexAtBirth === "Male" ? "s15" : "s14")
                }
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s14" && (
            <div className="sc">
              <div className="q">
                Are you pregnant, planning to become pregnant, or breastfeeding?
              </div>
              <Radio
                options={NO_YES}
                value={form.s14}
                onSelect={(value) => updateField("s14", value)}
              />
              <button
                type="button"
                className="cta"
                disabled={!form.s14}
                onClick={() => goTo(form.s14 === "Yes" ? "s14b" : "s15")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s14b" && (
            <div className="sc">
              <div className="q consent-warn">
                By selecting &ldquo;I Understand&rdquo; you understand that any
                prescribed treatment must be discontinued prior to attempting
                pregnancy, becoming pregnant, or upon beginning breastfeeding.
              </div>
              <div className="opts" style={{ gap: 7 }}>
                <label
                  className={`opt consent ${form.pregnancyConsent ? "sel" : ""}`}
                  onClick={() =>
                    updateField("pregnancyConsent", !form.pregnancyConsent)
                  }
                >
                  <span className="chk">✓</span>
                  <span className="consent-text">I understand</span>
                </label>
              </div>
              <button
                type="button"
                className="cta"
                disabled={!form.pregnancyConsent}
                onClick={() => goTo("s15")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s15" && (
            <div className="sc">
              <div className="q">Have you ever had pancreatitis?</div>
              <Radio
                options={NO_YES}
                value={form.s15}
                onSelect={(value) => updateField("s15", value)}
              />
              <button
                type="button"
                className="cta"
                disabled={!form.s15}
                onClick={() => {
                  if (form.s15 === "Yes") {
                    submitMauticOnComplete({}, "dHard");
                    goTo("dHard");
                  } else {
                    goTo("s16");
                  }
                }}
              >
                Continue
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════
              LIFESTYLE (s16, s17, s18)
              ════════════════════════════════════════════ */}
          {screen === "s16" && (
            <div className="sc">
              <div className="q">
                How many alcoholic drinks do you have in a week?
              </div>
              <Radio
                options={ALCOHOL_FREQUENCY}
                value={form.s16}
                onSelect={(value) => updateField("s16", value)}
              />
              <button
                type="button"
                className="cta"
                disabled={!form.s16}
                onClick={() => goTo("s17")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s17" && (
            <div className="sc">
              <div className="q">Do you use any recreational drugs?</div>
              <div className="qs">Your answer is private.</div>
              <Multi
                options={RECREATIONAL_DRUGS}
                values={form.s17}
                onToggle={(value) =>
                  toggleWithNone("s17", value, "I don't use any")
                }
              />
              {form.s17.includes("Other") && (
                <textarea
                  className="inp"
                  placeholder="Please specify"
                  value={form.s17Other}
                  onChange={(event) =>
                    updateField("s17Other", event.target.value)
                  }
                />
              )}
              <button
                type="button"
                className="cta"
                disabled={
                  form.s17.length === 0 ||
                  (form.s17.includes("Other") && !form.s17Other.trim())
                }
                onClick={() => goTo("s18")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s18" && (
            <div className="sc">
              <div className="q">
                Can you tell us a bit about your daily routine and habits?
              </div>
              <div className="qs">
                This helps your doctor build the right plan for you.
              </div>
              <div className="r2">
                <Select
                  style={{ margin: 0 }}
                  placeholder="Meals per day"
                  options={MEALS_PER_DAY}
                  value={form.meals}
                  onChange={(value) => updateField("meals", value)}
                />
                <Select
                  style={{ margin: 0 }}
                  placeholder="Exercise days / week"
                  options={EXERCISE_DAYS}
                  value={form.exercise}
                  onChange={(value) => updateField("exercise", value)}
                />
              </div>
              <div className="r2" style={{ marginTop: 8 }}>
                <Select
                  style={{ margin: 0 }}
                  placeholder="Sleep hours / night"
                  options={SLEEP_HOURS}
                  value={form.sleep}
                  onChange={(value) => updateField("sleep", value)}
                />
                <Select
                  style={{ margin: 0 }}
                  placeholder="Fast food / week"
                  options={FAST_FOOD_PER_WEEK}
                  value={form.fastFood}
                  onChange={(value) => updateField("fastFood", value)}
                />
              </div>
              <div className="r2" style={{ marginTop: 8 }}>
                <Select
                  style={{ margin: 0 }}
                  placeholder="Sugary drinks / week"
                  options={SUGARY_DRINKS_PER_WEEK}
                  value={form.sugary}
                  onChange={(value) => updateField("sugary", value)}
                />
                <Select
                  style={{ margin: 0 }}
                  placeholder="Water intake daily"
                  options={WATER_INTAKE}
                  value={form.water}
                  onChange={(value) => updateField("water", value)}
                />
              </div>
              <div className="stress-label">Stress level</div>
              <StressSlider
                value={form.stress}
                onChange={(value) => updateField("stress", value)}
              />
              <button
                type="button"
                className="cta"
                onClick={() => goTo("s19")}
              >
                Continue
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════
              PROFILE / ETHNICITY (s19)
              ════════════════════════════════════════════ */}
          {screen === "s19" && (
            <div className="sc">
              <div className="q">What is your ethnicity?</div>
              <div className="qs">
                We ask this to better tailor treatment options to you.
              </div>
              <Multi
                options={ETHNICITIES}
                values={form.s19}
                onToggle={(value) => toggleValue("s19", value)}
              />
              <button
                type="button"
                className="cta"
                disabled={form.s19.length === 0}
                onClick={() => goTo("s21")}
              >
                Continue
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════
              EMAIL CAPTURE + CONSENTS (s20)
              ════════════════════════════════════════════ */}
          {screen === "s20" && (
            <div className="sc">
              <div className="q">Find the right treatment for you</div>
              <div className="qs">
                Enter your email to see options tailored to your goals and
                health history.
              </div>
              <input
                className="inp"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
              />
              {form.email.length > 0 && !isValidEmail(form.email) && (
                <div className="field-err">
                  Please enter a valid email address.
                </div>
              )}
              <div className="opts" style={{ gap: 7 }}>
                <label
                  className={`opt consent ${form.consentH ? "sel" : ""}`}
                  onClick={() => updateField("consentH", !form.consentH)}
                >
                  <span className="chk">✓</span>
                  <span className="consent-text">
                    I agree to the <a href="#">HIPAA Authorization</a>
                  </span>
                </label>
                <label
                  className={`opt consent ${form.consentT ? "sel" : ""}`}
                  onClick={() => updateField("consentT", !form.consentT)}
                >
                  <span className="chk">✓</span>
                  <span className="consent-text">
                    I agree to the <a href="#">Telehealth Consent</a>,{" "}
                    <a href="#">Terms of Use</a> and{" "}
                    <a href="#">Privacy Policy</a>
                  </span>
                </label>
              </div>
              <button
                type="button"
                className="cta"
                disabled={!emailScreenIsValid}
                onClick={() => {
                  submitMauticOnEmailCapture();
                  goTo("s3");
                }}
              >
                Continue
              </button>
              <div className="or-row">
                <div className="line" />
                <span className="or">OR</span>
                <div className="line" />
              </div>
              <button type="button" className="cta2 google-btn">
                <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden>
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                Continue with Google
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════
              PROFILE DETAILS + MEDICATIONS (s21, s22)
              ════════════════════════════════════════════ */}
          {screen === "s21" && (
            <div className="sc">
              <div className="q">Complete your profile</div>
              <div className="qs">
                Your healthcare team will need this for treatment and
                prescriptions.
              </div>
              <div className="r2">
                <input
                  className="inp"
                  style={{ margin: 0 }}
                  type="text"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(event) =>
                    updateField("firstName", event.target.value)
                  }
                />
                <input
                  className="inp"
                  style={{ margin: 0 }}
                  type="text"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(event) =>
                    updateField("lastName", event.target.value)
                  }
                />
              </div>
              {form.firstName.length > 0 && !isValidName(form.firstName) && (
                <div className="field-err">
                  First name must be at least 2 characters.
                </div>
              )}
              {form.lastName.length > 0 && !isValidName(form.lastName) && (
                <div className="field-err">
                  Last name must be at least 2 characters.
                </div>
              )}
              <div className="r2" style={{ marginTop: 8 }}>
                <input
                  className="inp"
                  style={{ margin: 0 }}
                  type="date"
                  value={form.dob}
                  onChange={(event) => updateField("dob", event.target.value)}
                />
                <input
                  className="inp"
                  style={{ margin: 0 }}
                  type="text"
                  inputMode="numeric"
                  placeholder="ZIP code"
                  maxLength={5}
                  value={form.zip}
                  onChange={(event) => updateField("zip", event.target.value)}
                />
              </div>
              <input
                className="inp"
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
              {form.phone.length > 0 && !isValidPhone(form.phone) && (
                <div className="field-err">
                  Please enter a valid phone number (at least 10 digits).
                </div>
              )}
              <input
                className="inp"
                type="text"
                placeholder="Street address"
                value={form.address}
                onChange={(event) =>
                  updateField("address", event.target.value)
                }
              />
              <button
                type="button"
                className="cta"
                disabled={!profileScreenIsValid}
                onClick={() => goTo("s22")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s22" && (
            <div className="sc">
              <div className="q">
                Are you currently taking any medications or supplements?
              </div>
              <div className="qs">
                Include all prescriptions, OTC medications, and supplements.
              </div>
              <textarea
                className="inp"
                placeholder="e.g. Metformin 500mg, Fish Oil, Aspirin 81mg — or type None"
                value={form.meds}
                onChange={(event) => updateField("meds", event.target.value)}
              />
              <div className="q" style={{ fontSize: 16, marginBottom: 6 }}>
                Do you have any allergies?
              </div>
              <input
                className="inp"
                type="text"
                placeholder="e.g. Penicillin — or type None"
                value={form.allergies}
                onChange={(event) =>
                  updateField("allergies", event.target.value)
                }
              />
              <div className="q" style={{ fontSize: 16, marginBottom: 6 }}>
                Which pharmacy would you like to use?
              </div>
              <input
                className="inp"
                type="text"
                placeholder="e.g. CVS, 123 Main St (optional)"
                value={form.pharmacy}
                onChange={(event) =>
                  updateField("pharmacy", event.target.value)
                }
              />
              <button
                type="button"
                className="cta"
                onClick={() => goTo("s23")}
              >
                Continue
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════
              CONSULTATION BOOKING (s23)
              ════════════════════════════════════════════ */}
          {screen === "s23" && (
            <div className="sc">
              <div className="q">
                When would you like to meet your physician?
              </div>
              <div className="qs">
                Appointments are 15–20 minutes via secure video call. Pick the slot that works best for you.
              </div>

              <div className="cal2">
                {(() => {
                  // Group time slots by day so the user sees a clean
                  // "Monday → these times, Tuesday → these times" structure.
                  const days: string[] = [];
                  const byDay = new Map<string, typeof SLOTS[number][]>();
                  SLOTS.forEach((slot) => {
                    if (!byDay.has(slot.d)) {
                      byDay.set(slot.d, []);
                      days.push(slot.d);
                    }
                    byDay.get(slot.d)!.push(slot);
                  });
                  return days.map((day) => {
                    const slots = byDay.get(day)!;
                    return (
                      <div key={day} className="cal2-day">
                        <div className="cal2-day-head">
                          <span className="cal2-day-name">{day}</span>
                          <span className="cal2-day-count">
                            {slots.length} slot{slots.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="cal2-times">
                          {slots.map((slot) => {
                            const slotId = `${slot.d}|${slot.t}`;
                            const isSelected = form.slot === slotId;
                            return (
                              <button
                                key={slotId}
                                type="button"
                                className={`cal2-time ${isSelected ? "sel" : ""}`}
                                onClick={() => updateField("slot", slotId)}
                              >
                                {slot.t}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {form.slot && (
                <div className="cal2-confirm">
                  <span className="cal2-confirm-icon">✓</span>
                  <span>
                    You picked <strong>{form.slot.replace("|", " · ")}</strong>
                  </span>
                </div>
              )}

              <button
                type="button"
                className="cta"
                disabled={!form.slot}
                onClick={submit}
              >
                Confirm appointment
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════
              PLAN SELECTION + PAYMENT (sPlan, sPay)
              ════════════════════════════════════════════ */}
          {screen === "sPlan" && (
            <div className="sc">
              <div className="slabel">Choose your plan</div>
              <PlanCard
                selectedPlanId={form.plan}
                onSelectPlan={(planId) => updateField("plan", planId)}
              />
              <button
                type="button"
                className="cta cta-plan"
                onClick={() => goTo("sPay")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "sPay" && (
            <div className="sc">
              <div className="slabel">Payment</div>
              <div className="q">Secure your plan</div>
              <div className="qs">
                Complete your one-time payment to activate your{" "}
                {selectedPlan?.label ?? "plan"}.
              </div>
              <StripePayment
                email={form.email}
                name={`${form.firstName} ${form.lastName}`.trim()}
                zip={form.zip}
                plan={form.plan}
                planLabel={selectedPlan?.label ?? ""}
                onSuccess={() => {
                  updateField("paid", true);
                  submitMauticOnComplete({ paid: true }, "iConfirm");
                  goTo("iConfirm");
                }}
              />
            </div>
          )}

          {/* ════════════════════════════════════════════
              END STATES (iConfirm, dHard, iThanks)
              ════════════════════════════════════════════ */}
          {screen === "iConfirm" && (
            <div className="inter">
              <div className="ibg" />
              <div className="ic center">
                <div className="ic-body">
                  <div className="iconfirm-tick">✓</div>
                  <div
                    className="ititle"
                    style={{ fontSize: 26, marginBottom: 10 }}
                  >
                    You&apos;re all set!
                  </div>
                  <div className="ibody">
                    Your consultation is booked. Check your email for prep
                    instructions. Your doctor will review your intake before
                    the call.
                  </div>
                  <div className="cbox">
                    <strong>Consultation confirmed</strong>
                    <span>
                      {form.slot
                        ? form.slot.replace("|", " · ")
                        : "Your selected time"}{" "}
                      · Video call
                    </span>
                  </div>
                  <div className="cbox">
                    <strong>What to expect</strong>
                    <span>
                      Your doctor will discuss your goals and prescribe a
                      personalised GLP-1 plan if clinically appropriate.
                    </span>
                  </div>
                </div>
                <button type="button" className="icta">
                  Go to your patient portal →
                </button>
              </div>
            </div>
          )}

          {screen === "dHard" && (
            <div className="disq">
              {/* Big animated safety illustration. Multiple layers move
                  independently — halo breathes, dotted ring rotates,
                  heart beats, pulse line sweeps across the monitor view,
                  and sparkles drift around. Hover intensifies the rhythm. */}
              <div className="di-art" aria-hidden>
                <svg
                  className="di-svg"
                  viewBox="0 0 320 280"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="diHeart" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--wlf-brand-light)" />
                      <stop offset="100%" stopColor="var(--wlf-brand)" />
                    </linearGradient>
                    <radialGradient id="diHalo" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="var(--wlf-brand-soft)" stopOpacity="0.95" />
                      <stop offset="60%" stopColor="var(--wlf-brand-soft)" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="var(--wlf-brand-soft)" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="diMedallion" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
                      <stop offset="100%" stopColor="var(--wlf-brand-soft)" stopOpacity="0.5" />
                    </linearGradient>
                    <clipPath id="diMedallionClip">
                      <circle cx="160" cy="140" r="92" />
                    </clipPath>
                  </defs>

                  {/* Layer 1 — soft halo (breathes) */}
                  <circle
                    className="di-halo"
                    cx="160" cy="140" r="140"
                    fill="url(#diHalo)"
                  />

                  {/* Layer 2 — outer dotted ring (slowly rotates) */}
                  <circle
                    className="di-ring"
                    cx="160" cy="140" r="118"
                    fill="none"
                    stroke="var(--wlf-brand-light)"
                    strokeWidth="1.5"
                    strokeDasharray="2 8"
                    opacity="0.5"
                  />

                  {/* Layer 3 — sparkle particles (scattered, twinkle) */}
                  <g className="di-sparkles">
                    <circle className="di-spark di-spark-1" cx="58"  cy="56"  r="3" fill="var(--wlf-brand-light)" />
                    <circle className="di-spark di-spark-2" cx="262" cy="68"  r="2.5" fill="var(--wlf-brand)" />
                    <circle className="di-spark di-spark-3" cx="284" cy="200" r="3" fill="var(--wlf-brand-light)" />
                    <circle className="di-spark di-spark-4" cx="42"  cy="218" r="2.5" fill="var(--wlf-brand)" />
                    <circle className="di-spark di-spark-5" cx="206" cy="36"  r="2" fill="var(--wlf-brand-light)" />
                    <circle className="di-spark di-spark-6" cx="36"  cy="138" r="2" fill="var(--wlf-brand)" />
                    <circle className="di-spark di-spark-7" cx="288" cy="142" r="2.5" fill="var(--wlf-brand-light)" />
                  </g>

                  {/* Layer 4 — inner medallion card */}
                  <circle
                    cx="160" cy="140" r="92"
                    fill="url(#diMedallion)"
                    stroke="rgba(52, 126, 93, 0.14)"
                    strokeWidth="1"
                  />

                  {/* Layer 5 — pulse waveform (clipped to medallion) */}
                  <g clipPath="url(#diMedallionClip)">
                    {/* faint base line, always visible */}
                    <path
                      d="M 60 178 L 108 178 L 118 162 L 132 200 L 146 178 L 174 178 L 184 168 L 194 190 L 204 178 L 260 178"
                      stroke="var(--wlf-brand-dark)"
                      strokeWidth="1.8"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.18"
                    />
                    {/* bright sweep, animated */}
                    <path
                      className="di-pulse"
                      d="M 60 178 L 108 178 L 118 162 L 132 200 L 146 178 L 174 178 L 184 168 L 194 190 L 204 178 L 260 178"
                      stroke="var(--wlf-brand)"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                    />
                  </g>

                  {/* Layer 6 — heart with heartbeat */}
                  <g className="di-heart-wrap" transform="translate(160 124)">
                    <g className="di-heart">
                      {/* soft shadow that breathes with the heart */}
                      <ellipse
                        className="di-heart-shadow"
                        cx="0" cy="40" rx="38" ry="5"
                        fill="var(--wlf-brand-dark)"
                        opacity="0.12"
                      />
                      {/* the heart shape */}
                      <path
                        d="M 0 22 C -50 -8, -50 -43, -20 -43 C -10 -43, -2 -36, 0 -26 C 2 -36, 10 -43, 20 -43 C 50 -43, 50 -8, 0 22 Z"
                        fill="url(#diHeart)"
                      />
                      {/* soft highlight curve */}
                      <path
                        d="M -28 -28 Q -24 -36, -14 -36"
                        stroke="rgba(255,255,255,0.55)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </g>
                  </g>

                  {/* Layer 7 — small floating ripple rings (continuous) */}
                  <circle
                    className="di-ripple di-ripple-1"
                    cx="160" cy="140" r="92"
                    fill="none"
                    stroke="var(--wlf-brand)"
                    strokeWidth="2"
                  />
                  <circle
                    className="di-ripple di-ripple-2"
                    cx="160" cy="140" r="92"
                    fill="none"
                    stroke="var(--wlf-brand)"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <div className="dt">We want to keep you safe</div>
              <div className="db">
                Based on your answers, GLP-1 medications may not be appropriate
                for you at this time. Please speak with your primary care
                physician for personalised guidance.
              </div>
              <input
                className="inp"
                type="email"
                placeholder="Your email — we'll share helpful resources"
                style={{ maxWidth: 320, textAlign: "center" }}
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
              <button
                type="button"
                className="cta"
                style={{ maxWidth: 320, marginTop: 10 }}
                disabled={!isValidEmail(form.email)}
                onClick={() => {
                  submitMauticOnComplete({}, "iThanks");
                  logSubmission(
                    "iThanks",
                    "Weight loss onboarding — disqualified lead",
                  );
                }}
              >
                Keep me updated
              </button>
            </div>
          )}

          {screen === "iThanks" && (
            <div className="inter">
              <div className="ibg" />
              <div className="ic center">
                <div className="ic-body">
                  {/* Big animated celebration illustration — checkmark badge
                      with halo, dotted ring, sparkles and ripples. The check
                      draws itself on mount, then the badge enters a gentle
                      continuous pulse. */}
                  <div className="th-art" aria-hidden>
                    <svg
                      className="th-svg"
                      viewBox="0 0 320 280"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <linearGradient id="thBadge" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="var(--wlf-brand-light)" />
                          <stop offset="100%" stopColor="var(--wlf-brand)" />
                        </linearGradient>
                        <radialGradient id="thHalo" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="var(--wlf-brand-soft)" stopOpacity="0.95" />
                          <stop offset="60%" stopColor="var(--wlf-brand-soft)" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="var(--wlf-brand-soft)" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="thMedallion" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
                          <stop offset="100%" stopColor="var(--wlf-brand-soft)" stopOpacity="0.5" />
                        </linearGradient>
                      </defs>

                      {/* Halo — breathing */}
                      <circle
                        className="th-halo"
                        cx="160" cy="140" r="140"
                        fill="url(#thHalo)"
                      />

                      {/* Dotted ring — slow rotation */}
                      <circle
                        className="th-ring"
                        cx="160" cy="140" r="118"
                        fill="none"
                        stroke="var(--wlf-brand-light)"
                        strokeWidth="1.5"
                        strokeDasharray="2 8"
                        opacity="0.55"
                      />

                      {/* Sparkles — twinkling staggered */}
                      <g>
                        <circle className="th-spark th-spark-1" cx="58"  cy="56"  r="3"   fill="var(--wlf-brand-light)" />
                        <circle className="th-spark th-spark-2" cx="262" cy="68"  r="2.5" fill="var(--wlf-brand)" />
                        <circle className="th-spark th-spark-3" cx="284" cy="200" r="3"   fill="var(--wlf-brand-light)" />
                        <circle className="th-spark th-spark-4" cx="42"  cy="218" r="2.5" fill="var(--wlf-brand)" />
                        <circle className="th-spark th-spark-5" cx="206" cy="36"  r="2"   fill="var(--wlf-brand-light)" />
                        <circle className="th-spark th-spark-6" cx="36"  cy="138" r="2"   fill="var(--wlf-brand)" />
                        <circle className="th-spark th-spark-7" cx="288" cy="142" r="2.5" fill="var(--wlf-brand-light)" />
                      </g>

                      {/* Inner medallion */}
                      <circle
                        cx="160" cy="140" r="92"
                        fill="url(#thMedallion)"
                        stroke="rgba(52, 126, 93, 0.14)"
                        strokeWidth="1"
                      />

                      {/* Celebratory rays bursting from the badge */}
                      <g className="th-rays" stroke="var(--wlf-brand)" strokeWidth="3" strokeLinecap="round">
                        <line className="th-ray th-ray-1" x1="160" y1="68"  x2="160" y2="84"  />
                        <line className="th-ray th-ray-2" x1="206" y1="80"  x2="196" y2="93"  />
                        <line className="th-ray th-ray-3" x1="232" y1="124" x2="217" y2="129" />
                        <line className="th-ray th-ray-4" x1="232" y1="156" x2="217" y2="151" />
                        <line className="th-ray th-ray-5" x1="206" y1="200" x2="196" y2="187" />
                        <line className="th-ray th-ray-6" x1="160" y1="212" x2="160" y2="196" />
                        <line className="th-ray th-ray-7" x1="114" y1="200" x2="124" y2="187" />
                        <line className="th-ray th-ray-8" x1="88"  y1="156" x2="103" y2="151" />
                        <line className="th-ray th-ray-9" x1="88"  y1="124" x2="103" y2="129" />
                        <line className="th-ray th-ray-10" x1="114" y1="80"  x2="124" y2="93"  />
                      </g>

                      {/* Big check badge */}
                      <g className="th-badge-wrap" transform="translate(160 140)">
                        <g className="th-badge">
                          {/* Soft drop shadow */}
                          <ellipse cx="0" cy="58" rx="48" ry="6" fill="var(--wlf-brand-dark)" opacity="0.14" />
                          {/* Main badge circle */}
                          <circle r="56" fill="url(#thBadge)" />
                          {/* Highlight on the top */}
                          <ellipse cx="0" cy="-22" rx="36" ry="14" fill="rgba(255,255,255,0.22)" />
                          {/* The check mark — draws itself */}
                          <path
                            className="th-check"
                            d="M -22 2 L -8 18 L 24 -18"
                            stroke="#FFFFFF"
                            strokeWidth="7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                            pathLength={1}
                          />
                        </g>
                      </g>

                      {/* Ripple rings */}
                      <circle
                        className="th-ripple th-ripple-1"
                        cx="160" cy="140" r="92"
                        fill="none"
                        stroke="var(--wlf-brand)"
                        strokeWidth="2"
                      />
                      <circle
                        className="th-ripple th-ripple-2"
                        cx="160" cy="140" r="92"
                        fill="none"
                        stroke="var(--wlf-brand)"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>

                  <div
                    className="ititle"
                    style={{ fontSize: 26, marginBottom: 10 }}
                  >
                    Thanks — you&apos;re on the list
                  </div>
                  <div className="ibody">
                    We&apos;ll send helpful resources to{" "}
                    <strong>{form.email}</strong>. In the meantime, please
                    reach out to your primary care provider for personalised
                    guidance.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Theme switcher — rendered once at the root so it appears on every screen */}
      <ThemeSwitcher />
    </div>
  );
}

// ─────────────────────────────────────────
//  Inline screen components
// ─────────────────────────────────────────

// SectionStepper — horizontal row of pill buttons connected by dotted
// lines, one per section. The active section is filled with brand green;
// completed sections are filled but slightly softer; upcoming sections
// are outlined and muted. No icons, no extra text — just clean pills.
type SectionStepperProps = {
  section: SectionKey;
  currentScreen: ScreenId;
};

function SectionStepper({ section, currentScreen: _currentScreen }: SectionStepperProps) {
  const currentIdx = SECTIONS_ORDER.indexOf(section);

  return (
    <div className="step-pills" aria-label="Form progress">
      <div className="step-pills-track">
        {SECTIONS_ORDER.map((sec, i) => {
          const status =
            i < currentIdx ? "done" : i === currentIdx ? "active" : "todo";
          const isLast = i === SECTIONS_ORDER.length - 1;
          return (
            <div key={sec} className="step-pills-cell">
              <div
                className={`step-pill step-pill-${status}`}
                aria-current={status === "active" ? "step" : undefined}
              >
                {status === "done" && (
                  <span className="step-pill-check" aria-hidden>
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="5 12.5 10 17 19 7.5" />
                    </svg>
                  </span>
                )}
                <span className="step-pill-label">
                  {SECTION_INFO[sec].short}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`step-pills-line ${i < currentIdx ? "is-done" : ""}`}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  WeightProjection — motivational chart card shown on the iGood
//  interstitial. Compares "GLP-1 alone" baseline vs the user's
//  personalised plan trajectory across a 3-month window.
//  All math is derived from data the user has already entered:
//    • current weight from s3 (BMI screen)
//    • target loss range from s1 (e.g. "16–50 lbs.")
//  No new schema fields needed.
// ─────────────────────────────────────────

// Convert the user's stored weight to lbs regardless of the unit they used
function getCurrentLbs(form: Form): number {
  if (form.bmiUnit === "imperial") {
    return parseFloat(form.weightLbs) || 0;
  }
  const kg = parseFloat(form.weightKg) || 0;
  return kg * 2.20462;
}

// Estimate target loss in lbs from the s1 selection. Uses range midpoints.
function estimateLossLbs(form: Form, currentLbs: number): number {
  switch (form.s1) {
    case "1–15 lbs.":
      return 8;
    case "16–50 lbs.":
      return 33;
    case "50+ lbs.":
      // 50+ scales with current weight — bigger people likely have a bigger goal
      return Math.min(Math.max(60, currentLbs * 0.18), 130);
    default:
      // "I'm not sure yet" or unset — show ~10% of current weight as a friendly default
      return Math.max(8, currentLbs * 0.1);
  }
}

type WeightProjectionProps = {
  currentLbs: number;
  goalLbs: number;
};

function WeightProjection({ currentLbs, goalLbs }: WeightProjectionProps) {
  const lossLbs = Math.max(1, Math.round(currentLbs - goalLbs));
  const months = 3;

  // End date label (3 months from today)
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);
  const endDateStr = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // SVG layout
  const W = 600;
  const H = 260;
  const PAD_X = 36;
  const PAD_TOP = 70;     // space at top for the start-weight pill
  const PAD_BOTTOM = 70;  // space at bottom for x-axis labels + goal pill

  // Y-axis weight range (with a little headroom above current and below goal)
  const wMax = currentLbs;
  const wMin = goalLbs - lossLbs * 0.08;

  const wToY = (w: number): number => {
    const inner = H - PAD_TOP - PAD_BOTTOM;
    return PAD_TOP + ((wMax - w) / (wMax - wMin)) * inner;
  };

  // X positions
  const x0 = PAD_X;
  const xMid = W * 0.5;
  const xEnd = W - PAD_X;

  // Y positions
  const yStart = wToY(currentLbs);
  const yEnd = wToY(goalLbs);

  // "GLP-1 alone" path — ends ~60% of the way to goal (showing personalised
  // plan beats medication alone)
  const glpEndLbs = currentLbs - lossLbs * 0.6;
  const yGlpEnd = wToY(glpEndLbs);

  // Smooth cubic bezier curves
  const ourPath = `M ${x0},${yStart} C ${x0 + 140},${yStart} ${xEnd - 220},${yEnd + 18} ${xEnd},${yEnd}`;
  const glpPath = `M ${x0},${yStart} C ${x0 + 120},${yStart - 4} ${xEnd - 180},${yGlpEnd + 30} ${xEnd},${yGlpEnd}`;

  return (
    <div className="proj-card">
      {/* Decorative blobs */}
      <div className="proj-blob proj-blob-a" aria-hidden />
      <div className="proj-blob proj-blob-b" aria-hidden />

      <div className="proj-head">
        <h2 className="proj-title">
          Lose <strong>{lossLbs} lbs</strong>
          <br />
          in <span className="proj-pill">{months} months</span>
        </h2>
        <p className="proj-sub">
          Members with your profile have hit this goal. Your dose, plan &amp;
          timeline are calibrated to match.
        </p>
      </div>

      <div className="proj-chart">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Vertical guide lines — fade in early */}
          <line
            className="proj-guide"
            x1={x0} y1={yStart + 32} x2={x0} y2={H - PAD_BOTTOM + 16}
            stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4"
          />
          <line
            className="proj-guide proj-guide-2"
            x1={xMid} y1={PAD_TOP - 10} x2={xMid} y2={H - PAD_BOTTOM + 16}
            stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4"
          />
          <line
            className="proj-guide proj-guide-3"
            x1={xEnd} y1={yEnd - 10} x2={xEnd} y2={H - PAD_BOTTOM + 16}
            stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4"
          />

          {/* GLP-1 alone curve (lighter, higher endpoint) */}
          <path
            className="proj-curve proj-curve-glp"
            d={glpPath}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 5"
            pathLength={1}
          />
          {/* GLP-1 alone endpoint marker */}
          <g className="proj-glp-marker">
            <circle cx={xEnd} cy={yGlpEnd} r="6" fill="rgba(255,255,255,0.85)" />
            <circle cx={xEnd} cy={yGlpEnd} r="11" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <text
              x={xEnd - 16}
              y={yGlpEnd - 12}
              fill="rgba(255,255,255,0.9)"
              fontSize="11"
              fontWeight="600"
              textAnchor="end"
            >
              GLP-1 Alone
            </text>
          </g>

          {/* Our plan curve (solid, full descent) */}
          <path
            className="proj-curve proj-curve-ours"
            d={ourPath}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            pathLength={1}
          />

          {/* X-axis labels */}
          <text className="proj-axis" x={x0} y={H - 14} fill="rgba(255,255,255,0.7)" fontSize="11.5" textAnchor="middle" fontWeight="500">
            Today
          </text>
          <text className="proj-axis proj-axis-2" x={xMid} y={H - 14} fill="rgba(255,255,255,0.7)" fontSize="11.5" textAnchor="middle" fontWeight="500">
            1.5 mo
          </text>
          <text className="proj-axis proj-axis-3" x={xEnd} y={H - 14} fill="rgba(255,255,255,0.7)" fontSize="11.5" textAnchor="middle" fontWeight="500">
            {endDateStr}
          </text>

          {/* Start point pill — current weight */}
          <g transform={`translate(${x0}, ${yStart})`}>
            <g className="proj-pill-start">
              <circle r="4" fill="#FFFFFF" />
              <g transform="translate(0, -42)">
                <rect x="-30" y="-18" width="60" height="36" rx="18" fill="#1b4332" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <text y="-2" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="700">
                  {Math.round(currentLbs)}
                </text>
                <text y="11" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="9" fontWeight="500" letterSpacing="0.5">
                  Lbs
                </text>
              </g>
            </g>
          </g>

          {/* End point pill — goal weight (the hero moment) */}
          <g transform={`translate(${xEnd}, ${yEnd})`}>
            <g className="proj-pill-end">
              <circle r="5" fill="#FFFFFF" />
              <g transform="translate(-72, 14)">
                <rect x="0" y="0" width="144" height="58" rx="20" fill="#1b4332" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <text x="72" y="16" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="10.5" fontStyle="italic" fontWeight="600">
                  Ongo
                </text>
                <text x="72" y="36" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="700">
                  {Math.round(goalLbs)}
                  <tspan fontSize="10" fontWeight="500" fill="rgba(255,255,255,0.75)" dx="3"> Lbs</tspan>
                </text>
                <text x="72" y="50" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="500">
                  Your goal
                </text>
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}

// s9b — asks the surgery date and adapts its question to whichever procedure(s) the user selected.
type BariatricDateScreenProps = {
  procedures: string[];
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
};

function BariatricDateScreen({
  procedures,
  value,
  onChange,
  onContinue,
}: BariatricDateScreenProps) {
  const realProcedures = procedures.filter(
    (procedure) => procedure !== "None of these",
  );
  const { list, word } = buildSurgeryListText(realProcedures);

  return (
    <div className="sc">
      <div className="q">
        When was your {list} {word}?
      </div>
      <textarea
        className="inp"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!value.trim()}
        onClick={onContinue}
      >
        Continue
      </button>
    </div>
  );
}