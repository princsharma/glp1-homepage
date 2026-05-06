"use client";

import { createContext, useContext } from "react";
import type { Form, ScreenId } from "../schema";
import type { Plan } from "../data";
import type { BmiCategory } from "../utils";

export type OnboardContextValue = {
  screen: ScreenId;
  form: Form;
  uploadError: string;
  setUploadError: (err: string) => void;

  goTo: (next: ScreenId) => void;
  back: () => void;

  updateField: <K extends keyof Form>(field: K, value: Form[K]) => void;
  toggleValue: <K extends keyof Form>(field: K, value: string) => void;
  toggleWithNone: <K extends keyof Form>(
    field: K,
    value: string,
    noneValue: string,
  ) => void;

  submit: () => void;
  submitMauticOnEmailCapture: () => unknown;
  submitMauticOnComplete: (overrides: Partial<Form>, step: ScreenId) => unknown;

  bmi: number | null;
  bmiError: string | null;
  currentBmiCategory: BmiCategory | null;
  setBmiUnit: (next: "metric" | "imperial") => void;

  todayDate: string;
  maxDobDate: string;

  selectedPlan: Plan | undefined;
  emailScreenIsValid: boolean;
  profileScreenIsValid: boolean;
};

const OnboardContext = createContext<OnboardContextValue | null>(null);

export const OnboardProvider = OnboardContext.Provider;

export function useOnboard(): OnboardContextValue {
  const ctx = useContext(OnboardContext);
  if (!ctx) {
    throw new Error("useOnboard must be used inside <OnboardProvider>");
  }
  return ctx;
}
