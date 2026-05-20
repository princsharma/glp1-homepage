// Section 1 — clinician identity (name, phone). Phone is hidden from
// patients; we collect it for support contact only.

import styles from "../doctor-onboard.module.css";
import Section from "./Section";
import Field from "./Field";

export default function IdentitySection({ values, update }) {
  return (
    <Section number="1" title="Your details">
      <div className={styles.row2}>
        <Field label="First name" required>
          <input
            className={styles.input}
            type="text"
            autoComplete="given-name"
            value={values.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            placeholder="Vanessa"
          />
        </Field>
        <Field label="Last name" required>
          <input
            className={styles.input}
            type="text"
            autoComplete="family-name"
            value={values.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            placeholder="Niles"
          />
        </Field>
      </div>

      <Field label="Phone" required hint="We never share this with patients.">
        <input
          className={styles.input}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="(555) 123-4567"
        />
      </Field>
    </Section>
  );
}
