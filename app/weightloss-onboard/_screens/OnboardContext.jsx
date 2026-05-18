"use client";

import { createContext, useContext } from "react";

const OnboardContext = createContext(null);

export const OnboardProvider = OnboardContext.Provider;

export function useOnboard() {
  const ctx = useContext(OnboardContext);
  if (!ctx) {
    throw new Error("useOnboard must be used inside <OnboardProvider>");
  }
  return ctx;
}
