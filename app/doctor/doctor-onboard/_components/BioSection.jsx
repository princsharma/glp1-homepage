// Section 4 — professional bio. 30-character minimum so it isn't blank
// when shown to patients on the clinician picker.

import styles from "../doctor-onboard.module.css";
import Section from "./Section";
import Field from "./Field";

const MIN_LENGTH = 30;
const MAX_LENGTH = 600;

export default function BioSection({ values, update }) {
  const length = values.bio.trim().length;

  return (
    <Section number="4" title="About you">
      <Field
        label="Professional bio"
        required
        hint={`${length}/${MAX_LENGTH} characters · minimum ${MIN_LENGTH}`}
        hintTone={length < MIN_LENGTH ? "warn" : "muted"}
      >
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          rows={5}
          maxLength={MAX_LENGTH}
          value={values.bio}
          onChange={(e) => update("bio", e.target.value)}
          placeholder="Board-certified physician with 10+ years in metabolic health. Trained at…"
        />
      </Field>
    </Section>
  );
}
