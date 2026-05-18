"use client";

import { Multi } from "../components";
import { OTHER_CONDITIONS, WEIGHT_DIAGNOSES } from "../data";
import { useOnboard } from "./OnboardContext";

export function S10() {
  const { form, toggleWithNone, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        Have you been diagnosed with any of these health conditions?
      </div>
      <div className="qs">Select all that apply.</div>
      <Multi
        options={WEIGHT_DIAGNOSES}
        values={form.s10}
        onToggle={(value) =>
          toggleWithNone("s10", value, "None of the above")
        }
      />
      <button
        type="button"
        className="cta"
        disabled={form.s10.length === 0}
        onClick={() => goTo("s11")}
      >
        Continue
      </button>
    </div>
  );
}

export function S11() {
  const { form, updateField, toggleWithNone, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        Do you have any other health conditions we should know about?
      </div>
      <div className="qs">Select all that apply.</div>
      <Multi
        options={OTHER_CONDITIONS}
        values={form.s11}
        onToggle={(value) => toggleWithNone("s11", value, "None")}
      />
      <input
        className="inp"
        type="text"
        placeholder="Any other conditions? (optional)"
        value={form.s11Other}
        onChange={(event) => updateField("s11Other", event.target.value)}
      />
      <button
        type="button"
        className="cta"
        disabled={form.s11.length === 0}
        onClick={() => goTo("s12")}
      >
        Continue
      </button>
    </div>
  );
}
