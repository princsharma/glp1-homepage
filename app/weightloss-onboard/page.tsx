import type { Metadata } from "next";
import WeightlossOnboardForm from "./WeightlossOnboardForm";
 
export const metadata: Metadata = {
  title: "Weight Loss Onboarding · Ongo",
  description:
    "Answer a few questions to see if you're eligible for GLP-1 treatment and book your consultation.",
};
 
export default function Page() {
  return <WeightlossOnboardForm />;
}