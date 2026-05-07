"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./wlf.css";
import {
  bmiCategory,
  bmiInputError,
  calculateBmi,
  isValidEmail,
  isValidName,
  isValidPhone,
  isAtLeastAge,
} from "./utils";
import {
  type Form,
  type ScreenId,
  initialForm,
  noBackScreens,
} from "./schema";
import { submitToMautic } from "./mautic";
import { PLANS } from "./data";
import ThemeSwitcher from "@/components/ThemeSwitcher";

import {
  OnboardProvider,
  type OnboardContextValue,
} from "./_screens/OnboardContext";
import { MIN_AGE_YEARS } from "./_screens/constants";
import { SectionStepper, SCREEN_TO_SECTION } from "./_screens/sections";

import { S1Welcome, S2Inspiration } from "./_screens/WelcomeScreens";
import S3Bmi from "./_screens/BmiScreen";
import { IGood, IRoad } from "./_screens/InterstitialScreens";
import { S4, S5, S6 } from "./_screens/WeightHistoryScreens";
import { S7, S7m, S7b, S7a, S7c, S7d } from "./_screens/MedicationScreens";
import S7eIdentity from "./_screens/IdentityScreen";
import { S9, S9b } from "./_screens/BariatricScreens";
import { S10, S11 } from "./_screens/MedicalScreens";
import { S12, S13, S13a, S14, S14b, S15 } from "./_screens/SafetyScreens";
import { S16, S17, S18 } from "./_screens/LifestyleScreens";
import {
  S19,
  S20Email,
  S21,
  S22,
} from "./_screens/ProfileScreens";
import S22bDoctor from "./_screens/DoctorIntroScreen";
import S23Booking from "./_screens/S23Booking";
import { SPlan, SPay } from "./_screens/PlanPayScreens";
import { IConfirm, DHard, IThanks } from "./_screens/EndStateScreens";

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
  "s19", "s21", "s22", "s22b", "s23",
  "sPlan", "sPay", "iConfirm",
];

const SCREEN_COMPONENTS: Partial<Record<ScreenId, () => JSX.Element>> = {
  s1: S1Welcome,
  s2: S2Inspiration,
  s3: S3Bmi,
  iGood: IGood,
  iRoad: IRoad,
  s4: S4,
  s5: S5,
  s6: S6,
  s7: S7,
  s7m: S7m,
  s7b: S7b,
  s7a: S7a,
  s7c: S7c,
  s7d: S7d,
  s7e: S7eIdentity,
  s9: S9,
  s9b: S9b,
  s10: S10,
  s11: S11,
  s12: S12,
  s13: S13,
  s13a: S13a,
  s14: S14,
  s14b: S14b,
  s15: S15,
  s16: S16,
  s17: S17,
  s18: S18,
  s19: S19,
  s20: S20Email,
  s21: S21,
  s22: S22,
  s22b: S22bDoctor,
  s23: S23Booking,
  sPlan: SPlan,
  sPay: SPay,
  iConfirm: IConfirm,
  dHard: DHard,
  iThanks: IThanks,
};

export default function WeightlossOnboardForm() {
  const [screen, setScreen] = useState<ScreenId>("s1");
  const [form, setForm] = useState<Form>(initialForm);
  const [uploadError, setUploadError] = useState<string>("");
  const screenHistory = useRef<ScreenId[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // todayDate caps last-injection (s7c) at the present.
  // maxDobDate caps the DOB input (s21) so the calendar will not offer a
  // date that would make the user under MIN_AGE_YEARS.
  const { todayDate, maxDobDate } = useMemo(() => {
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const today = new Date();
    const dobCap = new Date();
    dobCap.setFullYear(dobCap.getFullYear() - MIN_AGE_YEARS);
    return { todayDate: fmt(today), maxDobDate: fmt(dobCap) };
  }, []);

  const progressPercent = useMemo(() => {
    if (screen === "dHard" || screen === "iThanks") return 0;
    const idx = PROGRESS_ORDER.indexOf(screen);
    if (idx === -1) return 0;
    return Math.round(((idx + 1) / PROGRESS_ORDER.length) * 100);
  }, [screen]);

  const goTo = useCallback((next: ScreenId) => {
    setScreen((curr) => {
      screenHistory.current.push(curr);
      return next;
    });
  }, []);

  const back = useCallback(() => {
    const previous = screenHistory.current.pop();
    if (previous) setScreen(previous);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setUploadError("");
  }, [screen]);

  const submitMauticOnEmailCapture = useCallback(
    () => submitToMautic(form, "s20"),
    [form],
  );
  const submitMauticOnComplete = useCallback(
    (overrides: Partial<Form>, step: ScreenId) =>
      submitToMautic({ ...form, ...overrides }, step),
    [form],
  );

  const updateField = useCallback(
    <K extends keyof Form>(field: K, value: Form[K]) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const toggleValue = useCallback(
    <K extends keyof Form>(field: K, value: string) =>
      setForm((prev) => {
        const current = prev[field] as string[];
        const next = current.includes(value)
          ? current.filter((entry) => entry !== value)
          : [...current, value];
        return { ...prev, [field]: next as Form[K] };
      }),
    [],
  );

  // Toggle a value, but treat `noneValue` as exclusive of every other value.
  const toggleWithNone = useCallback(
    <K extends keyof Form>(field: K, value: string, noneValue: string) =>
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
      }),
    [],
  );

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
  const setBmiUnit = useCallback((next: "metric" | "imperial") => {
    setForm((prev) => {
      if (next === prev.bmiUnit) return prev;
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
  }, []);

  const submit = useCallback(() => {
    goTo("sPlan");
  }, [goTo]);

  const selectedPlan = useMemo(
    () => PLANS.find((plan) => plan.id === form.plan),
    [form.plan],
  );

  // HIPAA (consentH) is required; Telehealth/Terms (consentT) is optional.
  const emailScreenIsValid = isValidEmail(form.email) && form.consentH;

  const profileScreenIsValid =
    isValidName(form.firstName) &&
    isValidName(form.lastName) &&
    isValidPhone(form.phone) &&
    isAtLeastAge(form.dob, MIN_AGE_YEARS);

  const onboardCtx = useMemo<OnboardContextValue>(
    () => ({
      screen,
      form,
      uploadError,
      setUploadError,
      goTo,
      back,
      updateField,
      toggleValue,
      toggleWithNone,
      submit,
      submitMauticOnEmailCapture,
      submitMauticOnComplete,
      bmi,
      bmiError,
      currentBmiCategory,
      setBmiUnit,
      todayDate,
      maxDobDate,
      selectedPlan,
      emailScreenIsValid,
      profileScreenIsValid,
    }),
    [
      screen,
      form,
      uploadError,
      goTo,
      back,
      updateField,
      toggleValue,
      toggleWithNone,
      submit,
      submitMauticOnEmailCapture,
      submitMauticOnComplete,
      bmi,
      bmiError,
      currentBmiCategory,
      setBmiUnit,
      todayDate,
      maxDobDate,
      selectedPlan,
      emailScreenIsValid,
      profileScreenIsValid,
    ],
  );

  const ScreenComponent = SCREEN_COMPONENTS[screen];

  return (
    <OnboardProvider value={onboardCtx}>
      <div className="wlf-root">
        <div className="wlf-page">
          <main className="fw" ref={scrollRef} aria-label="Weight loss onboarding">
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
              <a
                className="contact-link"
                href="tel:+18885550123"
                aria-label="Call Ongo Weight Loss at 1 (888) 555-0123"
              >
                <span className="contact-icon" aria-hidden="true">📞</span>
                <span className="contact-num">1 (888) 555-0123</span>
              </a>
            </div>

            {/* Top progress bar — only on screens WITHOUT the section stepper.
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

            {SCREEN_TO_SECTION[screen] && (
              <SectionStepper
                section={SCREEN_TO_SECTION[screen]!}
                currentScreen={screen}
              />
            )}

            {ScreenComponent && <ScreenComponent />}
          </main>
        </div>

        <ThemeSwitcher />
      </div>
    </OnboardProvider>
  );
}
