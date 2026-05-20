// Section 7 — default prescription template. Tokens like {{patientName}}
// get filled in automatically when the doctor issues a prescription.

import styles from "../doctor-onboard.module.css";
import Section from "./Section";
import Field from "./Field";

const MIN_LENGTH = 30;

export default function PrescriptionTemplateSection({ values, update }) {
  const length = values.prescriptionTemplate.trim().length;

  return (
    <Section
      number="7"
      title="Prescription template"
      description="Used as the default starting text whenever you issue a prescription. Tokens like {{patientName}} get filled in automatically."
    >
      <Field
        label="Template"
        required
        hint={`${length} characters · minimum ${MIN_LENGTH}`}
        hintTone={length < MIN_LENGTH ? "warn" : "muted"}
      >
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          rows={9}
          value={values.prescriptionTemplate}
          onChange={(e) => update("prescriptionTemplate", e.target.value)}
          placeholder="Patient: {{patientName}}&#10;Date: {{date}}…"
          style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }}
        />
      </Field>
    </Section>
  );
}
