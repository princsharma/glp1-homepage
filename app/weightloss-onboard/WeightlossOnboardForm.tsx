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
  isAtLeastAge,
  isValidEmail,
  isValidName,
  isValidPhone,
} from "./utils";

// Minimum age (in years) the user must be to proceed past the profile screen.
const MIN_AGE_YEARS: number = 18;
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
  generateSlots,
  STRUGGLE_DURATIONS,
  SUGARY_DRINKS_PER_WEEK,
  type GlpMedication,
  WATER_INTAKE,
  WEIGHT_DIAGNOSES,
  WEIGHT_GOALS,
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

  // Date constants for the date inputs. todayDate caps last-injection (s7c)
  // at the present; maxDobDate is exactly MIN_AGE_YEARS years ago today and
  // caps the DOB input (s21) so the calendar will not offer a date that
  // would make the user under the minimum age. Both formatted YYYY-MM-DD
  // using local timezone.
  const todayDate = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const maxDobDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - MIN_AGE_YEARS);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

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
    isValidPhone(form.phone) &&
    isAtLeastAge(form.dob, MIN_AGE_YEARS);

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

          {/* Progress bar — fills as the user advances through PROGRESS_ORDER */}
          {progressPercent > 0 && (
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

          {/* ════════════════════════════════════════════
              GOALS & INSPIRATION (s1, s2)
              ════════════════════════════════════════════ */}
          {screen === "s1" && (
            <div className="sc">
              <div className="q">How much weight would you like to lose?</div>
              <Radio
                options={WEIGHT_GOALS}
                value={form.s1}
                onSelect={(value) => updateField("s1", value)}
              />
              <div className="acct">
                Already have an account? <a href="#">Log in</a>
              </div>
              <button
                type="button"
                className="cta"
                disabled={!form.s1}
                onClick={() => goTo("s2")}
              >
                Continue
              </button>
            </div>
          )}

          {screen === "s2" && (
            <div className="sc">
              <div className="q">What&apos;s making you want to start now?</div>
              <div className="qs">Select all that apply.</div>
              <Multi
                options={INSPIRATIONS}
                values={form.s2}
                onToggle={(value) => toggleValue("s2", value)}
              />
              <div className="acct">
                Already have an account? <a href="#">Log in</a>
              </div>
              <button
                type="button"
                className="cta"
                disabled={form.s2.length === 0}
                onClick={() => goTo("s20")}
              >
                Continue
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════
              BMI (s3) → eligibility interstitial (iGood)
              ════════════════════════════════════════════ */}
          {screen === "s3" && (
            <div className="sc">
              <div className="q">What is your current height and weight?</div>
              <div
                className="acct"
                style={{ textAlign: "left", margin: "0 0 16px" }}
              >
                Already have an account? <a href="#">Log in</a>
              </div>

              <div className="unit-toggle">
                <button
                  type="button"
                  className={form.bmiUnit === "metric" ? "active" : ""}
                  onClick={() => setBmiUnit("metric")}
                >
                  Metric
                </button>
                <button
                  type="button"
                  className={form.bmiUnit === "imperial" ? "active" : ""}
                  onClick={() => setBmiUnit("imperial")}
                >
                  Imperial
                </button>
              </div>

              {form.bmiUnit === "metric" ? (
                <div className="r2">
                  <input
                    className="inp"
                    style={{ margin: 0 }}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={500}
                    placeholder="Weight (kg)"
                    value={form.weightKg}
                    onChange={(event) =>
                      updateField("weightKg", event.target.value)
                    }
                  />
                  <input
                    className="inp"
                    style={{ margin: 0 }}
                    type="number"
                    inputMode="numeric"
                    min={61}
                    max={274}
                    placeholder="Height (cm)"
                    value={form.heightCm}
                    onChange={(event) =>
                      updateField("heightCm", event.target.value)
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="r2">
                    <input
                      className="inp"
                      style={{ margin: 0 }}
                      type="number"
                      inputMode="numeric"
                      min={2}
                      max={9}
                      placeholder="Height (feet)"
                      value={form.heightFt}
                      onChange={(event) =>
                        updateField("heightFt", event.target.value)
                      }
                    />
                    <input
                      className="inp"
                      style={{ margin: 0 }}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={11}
                      placeholder="Height (inches)"
                      value={form.heightIn}
                      onChange={(event) =>
                        updateField("heightIn", event.target.value)
                      }
                    />
                  </div>
                  <input
                    className="inp"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={1100}
                    placeholder="Weight (pounds)"
                    value={form.weightLbs}
                    onChange={(event) =>
                      updateField("weightLbs", event.target.value)
                    }
                  />
                </>
              )}

              {bmiError && <div className="field-err">{bmiError}</div>}

              <BmiGauge
                bmi={bmiError ? null : bmi}
                category={bmiError ? null : currentBmiCategory}
              />

              {bmi !== null && !bmiError && (
                <div className="bmi-pill" style={{ textAlign: "center" }}>
                  {eligibilityText(bmi)}
                </div>
              )}

              <div className="cat-row">
                {BMI_CATEGORY_CARDS.map((category) => (
                  <div
                    key={category.key}
                    className={`cat-card ${currentBmiCategory === category.key ? "active" : ""}`}
                  >
                    <div className="cat-name">{category.name}</div>
                    <div className="cat-range">{category.range}</div>
                  </div>
                ))}
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

          {screen === "iGood" && (
            <div className="inter">
              <div className="ibg" />
              <div className="ic center">
                {/* <div className="center_banner mb-20">
                    <img src="images/all-good.png" alt="" />
                  </div> */}
                <div className="ic-body">
                  <div className="ititle">Good news!</div>
                  <div className="ibody">
                    Based on this info, <strong>you may be eligible</strong> for
                    GLP-1 treatment. Let&apos;s find the best option for your
                    goals.
                  </div>
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
          )}

          {/* ════════════════════════════════════════════
              ROADMAP INTERSTITIAL (iRoad)
              ════════════════════════════════════════════ */}
          {screen === "iRoad" && (
            <div className="inter">
              <div className="ibg" />
              <div className="ic center">
                <div className="ic-body">
                  <div className="ititle" style={{ fontSize: 27, marginBottom: 8 }}>
                    Great! Now a few questions
                  </div>
                  <div className="ibody" style={{ fontSize: 14, marginBottom: 22 }}>
                    First, answer health questions and see your treatment options.
                  </div>
                  <div className="rm">
                    <div className="rms">
                      <div className="rmi a">♥</div>
                      <div className="rmt">
                        <div className="rmlab">
                          Health history and treatment options
                        </div>
                        <span className="rmpill">3–4 minutes</span>
                      </div>
                    </div>
                    <div className="rms">
                      <div className="rmi i">📅</div>
                      <div className="rmt">
                        <div className="rmlab d">Book your consultation</div>
                      </div>
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
              <div className="slabel">Weight history</div>
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
              <div className="slabel">Weight history</div>
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
              <div className="slabel">Weight history</div>
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
              <div className="slabel">Medication history</div>
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
              <div className="slabel">Medication history</div>
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
              <div className="slabel">Medication history</div>
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
              <div className="slabel">Medication history</div>
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
              <div className="slabel">Medication history</div>
              <div className="q">
                What was the date of your last injection (Month/Day/Year)?
              </div>
              <input
                className="inp"
                type="date"
                max={todayDate}
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
              <div className="slabel">Medication history</div>
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
              <div className="q">ID Upload</div>
              <div className="qs">
                Please upload a government-issued photo ID
              </div>
              <div className="id-illus" aria-hidden>🪪</div>
              <div className="tips-card">
                <div className="tips-title">Tips for a good photo</div>
                <div className="tips-item">✓ Clearly shows your entire ID</div>
                <div className="tips-item">✓ Is not cropped, blurry, or dark</div>
                <div className="tips-note">
                  🔒 Your photos will not be shared with anyone except your
                  healthcare team.
                </div>
              </div>
              {form.photoIdName && (
                <div className="upload-name">✓ {form.photoIdName}</div>
              )}
              <div className="id-actions">
                <label className="cta2 id-btn">
                  Select photo
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
                <label className="cta cta-cap id-btn">
                  Take photo
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
              <div className="slabel">Weight history</div>
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
              <div className="slabel">Medical history</div>
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
              <div className="slabel">Medical history</div>
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
              <div className="slabel">Safety screening</div>
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
              <div className="slabel">Safety screening</div>
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
              <div className="slabel">Safety screening</div>
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
              <div className="slabel">Safety screening</div>
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
              <div className="slabel">Safety screening</div>
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
              <div className="slabel">Safety screening</div>
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
              <div className="slabel">Lifestyle</div>
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
              <div className="slabel">Lifestyle</div>
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
              <div className="slabel">Lifestyle</div>
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
              <div className="slabel">Profile</div>
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
              <div className="slabel">Your profile</div>
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
                  max={maxDobDate}
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
              {form.dob.length > 0 && !isAtLeastAge(form.dob, MIN_AGE_YEARS) && (
                <div className="field-err">
                  You must be at least {MIN_AGE_YEARS} year
                  {MIN_AGE_YEARS === 1 ? "" : "s"} old.
                </div>
              )}
              <input
                className="inp"
                type="tel"
                inputMode="numeric"
                placeholder="Phone number"
                maxLength={12}
                value={form.phone}
                onChange={(event) => {
                  // Strip non-digits and cap at 12 digits, so manual paste
                  // of a longer formatted number is also clamped.
                  const digits = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 12);
                  updateField("phone", digits);
                }}
              />
              {form.phone.length > 0 && !isValidPhone(form.phone) && (
                <div className="field-err">
                  Please enter a valid phone number (10–12 digits).
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
              <div className="slabel">Medications</div>
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
                When would you like to schedule your consultation?
              </div>
              <div className="qs">
                Choose a time that works for you. Appointments are 15–20 minutes
                with a licensed physician.
              </div>
              <div className="cal">
                {generateSlots().map((slot) => {
                  const slotId = `${slot.d}|${slot.t}`;
                  return (
                    <div
                      key={slotId}
                      className={`cs ${form.slot === slotId ? "sel" : ""}`}
                      onClick={() => updateField("slot", slotId)}
                    >
                      <div className="csd">{slot.d}</div>
                      <div className="cst">{slot.t}</div>
                    </div>
                  );
                })}
              </div>
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
              <div className="di">🩺</div>
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
                  <div className="iconfirm-tick">✓</div>
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