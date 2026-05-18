"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./wlf.css";
import {
  bmiCategory,
  bmiInputError,
  calculateBmi,
  isValidEmail,
  isValidName,
  isValidPassword,
  isValidPhone,
  isAtLeastAge,
} from "./utils";
import {
  initialForm,
  noBackScreens,
} from "./schema";
import { submitToMautic } from "./mautic";
import {
  saveOnboardingProgress,
  sendResetEmail,
  signInOrSignUp,
} from "./firebaseClient";
import { PLANS } from "./data";
import ThemeSwitcher from "@/components/ThemeSwitcher";

import { OnboardProvider } from "./_screens/OnboardContext";
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
const PROGRESS_ORDER = [
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

const SCREEN_COMPONENTS = {
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
  const [screen, setScreen] = useState("s1");
  const [form, setForm] = useState(initialForm);
  const [uploadError, setUploadError] = useState("");
  const screenHistory = useRef([]);
  const scrollRef = useRef(null);

  const { todayDate, maxDobDate } = useMemo(() => {
    const fmt = (d) =>
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

  const goTo = useCallback((next) => {
    setScreen((curr) => {
      screenHistory.current.push(curr);
      return next;
    });
  }, []);

  const back = useCallback(() => {
    const previous = screenHistory.current.pop();
    if (previous) setScreen(previous);
  }, []);

  // Tracks whether the user is signed in. Once true, subsequent screen
  // transitions auto-save form progress via /api/onboarding/save-progress.
  // Declared BEFORE the auto-save effect so the effect's dependency array can
  // reference it without hitting the temporal dead zone.
  const [authenticatedUid, setAuthenticatedUid] = useState(null);
  const [captureError, setCaptureError] = useState("");
  // `captureErrorKind` mirrors the `err.kind` from signInOrSignUp so the
  // UI can render the right recovery affordance (e.g. forgot-password link
  // for EMAIL_REGISTERED_WRONG_PASSWORD).
  const [captureErrorKind, setCaptureErrorKind] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "instant" });
    setUploadError("");
  }, [screen]);

  // Auto-save form progress to Firestore whenever the user advances to a new
  // screen — but only after the user is authenticated (post email capture).
  // Best-effort: failures are swallowed inside saveOnboardingProgress so they
  // never block UX. The final screen will re-send the full snapshot anyway.
  useEffect(() => {
    if (!authenticatedUid) return;
    const isTerminal = screen === "iThanks" || screen === "iConfirm";
    saveOnboardingProgress(form, screen, isTerminal ? "onboarded" : undefined);
    // We intentionally watch `screen` only — saving on every keystroke would
    // be wasteful. The end-of-screen save captures the full state at that point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, authenticatedUid]);

  // Combined handler for the email screen Continue button:
  //   1. Fire-and-forget the existing Mautic marketing submit (unchanged)
  //   2. Try sign-in with email+password, fall back to sign-up if no account
  //   3. After auth, save the form snapshot to Firestore
  // Returns true on success — the screen uses this to decide whether to goTo.
  const submitMauticOnEmailCapture = useCallback(async () => {
    setCaptureError("");
    setCaptureErrorKind("");
    setResetEmailSent(false);
    setIsCapturing(true);
    // Existing Mautic marketing capture — fire and forget.
    submitToMautic(form, "s20");
    try {
      const { uid } = await signInOrSignUp(
        form.email.trim().toLowerCase(),
        form.password,
      );
      setAuthenticatedUid(uid);
      // First save right after auth — ensures the users/{uid} doc exists with
      // the consents and any data already entered before reaching s20.
      await saveOnboardingProgress(form, "s20", undefined);
      return true;
    } catch (err) {
      setCaptureError(err?.message || "Could not save your information.");
      setCaptureErrorKind(err?.kind || "");
      return false;
    } finally {
      setIsCapturing(false);
    }
  }, [form]);

  // Triggered by the "Forgot password?" link shown after a password mismatch
  // on the email screen. Uses Firebase's built-in reset email template — no
  // Mautic / custom email needed.
  const requestPasswordReset = useCallback(async () => {
    if (!isValidEmail(form.email)) return;
    try {
      await sendResetEmail(form.email.trim().toLowerCase());
      setResetEmailSent(true);
      setCaptureError("");
      setCaptureErrorKind("");
    } catch (err) {
      setCaptureError(
        err?.message || "Could not send the reset email. Please try again.",
      );
    }
  }, [form.email]);

  const submitMauticOnComplete = useCallback(
    (overrides, step) =>
      submitToMautic({ ...form, ...overrides }, step),
    [form],
  );

  const updateField = useCallback(
    (field, value) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const toggleValue = useCallback(
    (field, value) =>
      setForm((prev) => {
        const current = prev[field];
        const next = current.includes(value)
          ? current.filter((entry) => entry !== value)
          : [...current, value];
        return { ...prev, [field]: next };
      }),
    [],
  );

  // Toggle a value, but treat `noneValue` as exclusive of every other value.
  const toggleWithNone = useCallback(
    (field, value, noneValue) =>
      setForm((prev) => {
        const current = prev[field];
        let next;
        if (value === noneValue) {
          next = current.includes(noneValue) ? [] : [noneValue];
        } else {
          const without = current.filter(
            (entry) => entry !== value && entry !== noneValue,
          );
          next = current.includes(value) ? without : [...without, value];
        }
        return { ...prev, [field]: next };
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

  const setBmiUnit = useCallback((next) => {
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
  // Password is required here because S20 doubles as account creation.
  const emailScreenIsValid =
    isValidEmail(form.email) && isValidPassword(form.password) && form.consentH;

  const profileScreenIsValid =
    isValidName(form.firstName) &&
    isValidName(form.lastName) &&
    isValidPhone(form.phone) &&
    isAtLeastAge(form.dob, MIN_AGE_YEARS);

  const onboardCtx = useMemo(
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
      // Auth / capture state for the email screen UI.
      authenticatedUid,
      captureError,
      captureErrorKind,
      isCapturing,
      resetEmailSent,
      requestPasswordReset,
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
      authenticatedUid,
      captureError,
      captureErrorKind,
      isCapturing,
      resetEmailSent,
      requestPasswordReset,
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
                section={SCREEN_TO_SECTION[screen]}
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
