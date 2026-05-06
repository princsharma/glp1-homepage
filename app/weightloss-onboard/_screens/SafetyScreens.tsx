"use client";

import { Multi, Radio } from "../components";
import {
  NO_YES,
  NO_YES_UNSURE,
  SAFETY_TREATMENTS,
  SEX_OPTIONS,
} from "../data";
import { useOnboard } from "./OnboardContext";

export function S12() {
  const { form, toggleWithNone, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        Are you currently dealing with any of the following?
      </div>
      <div className="qs">Select all that apply.</div>
      <Multi
        options={SAFETY_TREATMENTS}
        values={form.s12}
        onToggle={(value) => toggleWithNone("s12", value, "None")}
      />
      <button
        type="button"
        className="cta"
        disabled={form.s12.length === 0}
        onClick={() => goTo("s13")}
      >
        Continue
      </button>
    </div>
  );
}

export function S13() {
  const { form, updateField, goTo, submitMauticOnComplete } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        Have you or a close family member had medullary thyroid cancer
        or MEN2 syndrome?
      </div>
      <Radio
        options={NO_YES_UNSURE}
        value={form.s13}
        onSelect={(value) => updateField("s13", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.s13}
        onClick={() => {
          if (form.s13 === "Yes") {
            submitMauticOnComplete({}, "dHard");
            goTo("dHard");
          } else {
            goTo("s13a");
          }
        }}
      >
        Continue
      </button>
    </div>
  );
}

export function S13a() {
  const { form, updateField, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">What was your sex assigned at birth?</div>
      <Radio
        options={SEX_OPTIONS}
        value={form.sexAtBirth}
        onSelect={(value) => updateField("sexAtBirth", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.sexAtBirth}
        onClick={() =>
          goTo(form.sexAtBirth === "Male" ? "s15" : "s14")
        }
      >
        Continue
      </button>
    </div>
  );
}

export function S14() {
  const { form, updateField, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        Are you pregnant, planning to become pregnant, or breastfeeding?
      </div>
      <Radio
        options={NO_YES}
        value={form.s14}
        onSelect={(value) => updateField("s14", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.s14}
        onClick={() => goTo(form.s14 === "Yes" ? "s14b" : "s15")}
      >
        Continue
      </button>
    </div>
  );
}

export function S14b() {
  const { form, updateField, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q consent-warn">
        By selecting &ldquo;I Understand&rdquo; you understand that any
        prescribed treatment must be discontinued prior to attempting
        pregnancy, becoming pregnant, or upon beginning breastfeeding.
      </div>
      <div className="opts" style={{ gap: 7 }}>
        <label
          className={`opt consent ${form.pregnancyConsent ? "sel" : ""}`}
          onClick={() =>
            updateField("pregnancyConsent", !form.pregnancyConsent)
          }
        >
          <span className="chk">✓</span>
          <span className="consent-text">I understand</span>
        </label>
      </div>
      <button
        type="button"
        className="cta"
        disabled={!form.pregnancyConsent}
        onClick={() => goTo("s15")}
      >
        Continue
      </button>
    </div>
  );
}

export function S15() {
  const { form, updateField, goTo, submitMauticOnComplete } = useOnboard();

  return (
    <div className="sc">
      <div className="q">Have you ever had pancreatitis?</div>
      <Radio
        options={NO_YES}
        value={form.s15}
        onSelect={(value) => updateField("s15", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.s15}
        onClick={() => {
          if (form.s15 === "Yes") {
            submitMauticOnComplete({}, "dHard");
            goTo("dHard");
          } else {
            goTo("s16");
          }
        }}
      >
        Continue
      </button>
    </div>
  );
}
