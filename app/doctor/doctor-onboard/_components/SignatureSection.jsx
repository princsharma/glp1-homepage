// Section 8 — optional e-signature. Stamped onto prescriptions and chart
// notes once captured. Can be added later from the doctor profile page.

"use client";

import SignaturePad from "../SignaturePad";
import Section from "./Section";
import Field from "./Field";

export default function SignatureSection({
  sigRef,
  signatureFilled,
  setSignatureFilled,
}) {
  return (
    <Section
      number="8"
      title="E-signature"
      description="Optional. We'll stamp this on prescriptions and chart notes you sign off. You can add it later from your profile."
    >
      <Field
        label="Sign below"
        hint={
          signatureFilled
            ? "Signature captured."
            : "Optional — skip if you'd rather add it later."
        }
      >
        <SignaturePad
          refHandle={sigRef}
          height={180}
          onChange={() => setSignatureFilled(!sigRef.current?.isEmpty())}
        />
      </Field>
    </Section>
  );
}
