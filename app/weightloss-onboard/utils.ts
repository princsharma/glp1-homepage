// Pure helpers used by the onboarding form. No React, no state.
// Anything related to validation, BMI math, or text formatting lives here.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isValidEmail = (email: string) => EMAIL_REGEX.test(email.trim());
export const isValidName = (name: string) => name.trim().length >= 2;
export const isValidPhone = (phone: string) =>
  phone.replace(/\D/g, "").length >= 10;

// Returns true when the supplied YYYY-MM-DD birthdate puts the user at
// `years`+ today (uses local date components, not UTC).
export function isAtLeastAge(dob: string, years: number): boolean {
  if (!dob) return false;
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = new Date();
  const cutoff = new Date(
    today.getFullYear() - years,
    today.getMonth(),
    today.getDate(),
  );
  return parsed.getTime() <= cutoff.getTime();
}

export type BmiCategory = "under" | "healthy" | "over" | "obese";

export function bmiCategory(bmi: number | null): BmiCategory | null {
  if (bmi == null) return null;
  if (bmi < 18.5) return "under";
  if (bmi < 25) return "healthy";
  if (bmi < 30) return "over";
  return "obese";
}

export function eligibilityText(bmi: number | null): string {
  if (bmi == null) return "Enter your details";
  if (bmi >= 30) return "Likely qualifies";
  if (bmi >= 27) return "May qualify";
  return "Unlikely to qualify";
}

type BmiInput = {
  unit: "metric" | "imperial";
  heightFt: string;
  heightIn: string;
  weightLbs: string;
  heightCm: string;
  weightKg: string;
};

export function calculateBmi(input: BmiInput): number | null {
  if (input.unit === "imperial") {
    const feet = parseFloat(input.heightFt) || 0;
    const inches = parseFloat(input.heightIn) || 0;
    const pounds = parseFloat(input.weightLbs) || 0;
    if (feet <= 0 || pounds <= 0) return null;
    const totalInches = feet * 12 + inches;
    if (totalInches <= 0) return null;
    return (pounds * 703) / (totalInches * totalInches);
  }
  const cm = parseFloat(input.heightCm) || 0;
  const kg = parseFloat(input.weightKg) || 0;
  if (cm <= 0 || kg <= 0) return null;
  const meters = cm / 100;
  return kg / (meters * meters);
}

export function bmiInputError(input: BmiInput): string | null {
  if (input.unit === "imperial") {
    const feet = parseFloat(input.heightFt);
    const inches = parseFloat(input.heightIn) || 0;
    const pounds = parseFloat(input.weightLbs);
    if (input.heightFt && feet < 2) return "Height must be at least 2 feet.";
    if (input.heightFt && (feet > 9 || (feet === 9 && inches > 0)))
      return "Height must be 9 feet or less.";
    if (input.heightIn && (inches < 0 || inches > 11))
      return "Inches must be between 0 and 11.";
    if (input.weightLbs && pounds > 1100)
      return "Weight must be 1100 lbs or less.";
    return null;
  }
  const cm = parseFloat(input.heightCm);
  const kg = parseFloat(input.weightKg);
  if (input.heightCm && cm < 61)
    return "Height must be at least 61 cm (2 ft).";
  if (input.heightCm && cm > 274)
    return "Height must be 274 cm (9 ft) or less.";
  if (input.weightKg && kg > 500) return "Weight must be 500 kg or less.";
  return null;
}

// Builds a grammatical list out of bariatric procedure names.
// e.g. ["Lap band", "Gastric sleeve"] -> { list: "lap band and gastric sleeve", word: "surgeries" }
export function buildSurgeryListText(procedures: string[]): {
  list: string;
  word: string;
} {
  const lowered = procedures.map((procedure) => procedure.toLowerCase());
  let list = "";
  if (lowered.length <= 1) {
    list = lowered[0] ?? "";
  } else if (lowered.length === 2) {
    list = `${lowered[0]} and ${lowered[1]}`;
  } else {
    const head = lowered.slice(0, -1).join(", ");
    const tail = lowered[lowered.length - 1];
    list = `${head}, and ${tail}`;
  }
  const word = procedures.length > 1 ? "surgeries" : "surgery";
  return { list, word };
}

export function formatSavings(amount: number): string {
  return amount < 0 ? `Save $-${Math.abs(amount)}` : `Save $${amount}`;
}
