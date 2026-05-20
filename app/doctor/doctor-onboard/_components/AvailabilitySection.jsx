// Section 6 — slot duration pill group + per-day start/end windows. At
// least one enabled day with a valid start/end is required to submit.

import styles from "../doctor-onboard.module.css";
import { DAYS, SLOT_OPTIONS } from "../_lib/constants";
import Section from "./Section";

export default function AvailabilitySection({
  values,
  update,
  updateDay,
  availabilityValid,
}) {
  return (
    <Section
      number="6"
      title="Weekly availability"
      description="Set your default consultation hours. You can fine-tune (multiple windows per day, blocked dates) from your dashboard later."
    >
      <div className={styles.slotDurationRow}>
        <span className={styles.fieldLabel}>Slot duration</span>
        <div className={styles.pillGroup}>
          {SLOT_OPTIONS.map((mins) => (
            <button
              key={mins}
              type="button"
              className={`${styles.pill} ${values.slotDurationMinutes === mins ? styles.pillActive : ""}`}
              onClick={() => update("slotDurationMinutes", mins)}
            >
              {mins} min
            </button>
          ))}
        </div>
      </div>

      <div className={styles.dayList}>
        {DAYS.map((d) => {
          const cfg = values.availability[d.key];
          const invalid =
            cfg.enabled && cfg.start && cfg.end && cfg.start >= cfg.end;
          return (
            <div key={d.key} className={styles.dayRow}>
              <label className={styles.dayToggle}>
                <input
                  type="checkbox"
                  checked={cfg.enabled}
                  onChange={(e) => updateDay(d.key, { enabled: e.target.checked })}
                />
                <span>{d.label}</span>
              </label>
              <input
                type="time"
                className={`${styles.timeInput} ${invalid ? styles.timeInputErr : ""}`}
                value={cfg.start}
                onChange={(e) => updateDay(d.key, { start: e.target.value })}
                disabled={!cfg.enabled}
              />
              <span className={styles.timeDash}>→</span>
              <input
                type="time"
                className={`${styles.timeInput} ${invalid ? styles.timeInputErr : ""}`}
                value={cfg.end}
                onChange={(e) => updateDay(d.key, { end: e.target.value })}
                disabled={!cfg.enabled}
              />
            </div>
          );
        })}
      </div>
      {!availabilityValid && (
        <p className={styles.fieldHintWarn} style={{ marginTop: 6 }}>
          Pick at least one day with a valid start/end window.
        </p>
      )}
    </Section>
  );
}
