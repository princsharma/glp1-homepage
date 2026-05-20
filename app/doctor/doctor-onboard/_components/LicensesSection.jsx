// Section 5 — repeating state-license block. Doctors can add more later
// from their dashboard, so the minimum here is one.

import styles from "../doctor-onboard.module.css";
import { LICENSE_TYPES, US_STATES } from "../states";
import Section from "./Section";
import Field from "./Field";

export default function LicensesSection({
  values,
  updateLicense,
  addLicense,
  removeLicense,
}) {
  return (
    <Section
      number="5"
      title="State licenses"
      description="Add every state you're currently licensed to practice in. You can add more later from your dashboard."
    >
      <div className={styles.licenses}>
        {values.licenses.map((lic, i) => (
          <div key={i} className={styles.licenseRow}>
            <div className={styles.licenseHeader}>
              <span className={styles.licenseBadge}>License #{i + 1}</span>
              {values.licenses.length > 1 && (
                <button
                  type="button"
                  className={styles.licenseRemove}
                  onClick={() => removeLicense(i)}
                  aria-label={`Remove license ${i + 1}`}
                >
                  Remove
                </button>
              )}
            </div>

            <Field label="State" required>
              <select
                className={styles.input}
                value={lic.state}
                onChange={(e) => updateLicense(i, "state", e.target.value)}
              >
                <option value="">Choose a state…</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className={styles.row2}>
              <Field label="License number" required>
                <input
                  className={styles.input}
                  type="text"
                  value={lic.licenseNumber}
                  onChange={(e) =>
                    updateLicense(i, "licenseNumber", e.target.value)
                  }
                  placeholder="ME-12345"
                />
              </Field>
              <Field label="License type">
                <select
                  className={styles.input}
                  value={lic.licenseType}
                  onChange={(e) =>
                    updateLicense(i, "licenseType", e.target.value)
                  }
                >
                  {LICENSE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        ))}

        <button type="button" className={styles.addBtn} onClick={addLicense}>
          + Add another state license
        </button>
      </div>
    </Section>
  );
}
