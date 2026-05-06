"use client";

import { Multi, Radio } from "../components";
import { PAST_METHODS, STRUGGLE_DURATIONS } from "../data";
import { useOnboard } from "./OnboardContext";

export function S4() {
  const { form, updateField, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        Can you share a little about your weight journey so far?
      </div>
      <div className="qs">
        This helps your doctor understand your journey.
      </div>
      <div className="r2">
        <input
          className="inp"
          style={{ margin: 0 }}
          type="number"
          inputMode="numeric"
          placeholder="Highest adult weight (lbs)"
          value={form.wtHigh}
          onChange={(event) => updateField("wtHigh", event.target.value)}
        />
        <input
          className="inp"
          style={{ margin: 0 }}
          type="number"
          inputMode="numeric"
          placeholder="Lowest weight, past 5 yrs (lbs)"
          value={form.wtLow}
          onChange={(event) => updateField("wtLow", event.target.value)}
        />
      </div>
      <input
        className="inp"
        type="number"
        inputMode="numeric"
        placeholder="Goal weight (lbs)"
        value={form.wtGoal}
        onChange={(event) => updateField("wtGoal", event.target.value)}
      />
      <input
        className="inp"
        type="number"
        inputMode="numeric"
        placeholder="Waist circumference (inches) — optional"
        value={form.waist}
        onChange={(event) => updateField("waist", event.target.value)}
      />
      <button
        type="button"
        className="cta"
        onClick={() => goTo("s5")}
      >
        Continue
      </button>
    </div>
  );
}

export function S5() {
  const { form, updateField, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        How long has your weight been a concern for you?
      </div>
      <Radio
        options={STRUGGLE_DURATIONS}
        value={form.s5}
        onSelect={(value) => updateField("s5", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.s5}
        onClick={() => goTo("s6")}
      >
        Continue
      </button>
    </div>
  );
}

export function S6() {
  const { form, toggleValue, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">What have you tried before to lose weight?</div>
      <div className="qs">Select all that apply.</div>
      <Multi
        options={PAST_METHODS}
        values={form.s6}
        onToggle={(value) => toggleValue("s6", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={form.s6.length === 0}
        onClick={() => goTo("s7")}
      >
        Continue
      </button>
    </div>
  );
}
