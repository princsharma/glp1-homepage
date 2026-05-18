"use client";

import { Multi, Radio, Select, StressSlider } from "../components";
import {
  ALCOHOL_FREQUENCY,
  EXERCISE_DAYS,
  FAST_FOOD_PER_WEEK,
  MEALS_PER_DAY,
  RECREATIONAL_DRUGS,
  SLEEP_HOURS,
  SUGARY_DRINKS_PER_WEEK,
  WATER_INTAKE,
} from "../data";
import { useOnboard } from "./OnboardContext";

export function S16() {
  const { form, updateField, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        How many alcoholic drinks do you have in a week?
      </div>
      <Radio
        options={ALCOHOL_FREQUENCY}
        value={form.s16}
        onSelect={(value) => updateField("s16", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.s16}
        onClick={() => goTo("s17")}
      >
        Continue
      </button>
    </div>
  );
}

export function S17() {
  const { form, updateField, toggleWithNone, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">Do you use any recreational drugs?</div>
      <div className="qs">Your answer is private.</div>
      <Multi
        options={RECREATIONAL_DRUGS}
        values={form.s17}
        onToggle={(value) =>
          toggleWithNone("s17", value, "I don't use any")
        }
      />
      {form.s17.includes("Other") && (
        <textarea
          className="inp"
          placeholder="Please specify"
          value={form.s17Other}
          onChange={(event) => updateField("s17Other", event.target.value)}
        />
      )}
      <button
        type="button"
        className="cta"
        disabled={
          form.s17.length === 0 ||
          (form.s17.includes("Other") && !form.s17Other.trim())
        }
        onClick={() => goTo("s18")}
      >
        Continue
      </button>
    </div>
  );
}

export function S18() {
  const { form, updateField, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        Can you tell us a bit about your daily routine and habits?
      </div>
      <div className="qs">
        This helps your doctor build the right plan for you.
      </div>
      <div className="r2">
        <Select
          style={{ margin: 0 }}
          placeholder="Meals per day"
          options={MEALS_PER_DAY}
          value={form.meals}
          onChange={(value) => updateField("meals", value)}
        />
        <Select
          style={{ margin: 0 }}
          placeholder="Exercise days / week"
          options={EXERCISE_DAYS}
          value={form.exercise}
          onChange={(value) => updateField("exercise", value)}
        />
      </div>
      <div className="r2" style={{ marginTop: 8 }}>
        <Select
          style={{ margin: 0 }}
          placeholder="Sleep hours / night"
          options={SLEEP_HOURS}
          value={form.sleep}
          onChange={(value) => updateField("sleep", value)}
        />
        <Select
          style={{ margin: 0 }}
          placeholder="Fast food / week"
          options={FAST_FOOD_PER_WEEK}
          value={form.fastFood}
          onChange={(value) => updateField("fastFood", value)}
        />
      </div>
      <div className="r2" style={{ marginTop: 8 }}>
        <Select
          style={{ margin: 0 }}
          placeholder="Sugary drinks / week"
          options={SUGARY_DRINKS_PER_WEEK}
          value={form.sugary}
          onChange={(value) => updateField("sugary", value)}
        />
        <Select
          style={{ margin: 0 }}
          placeholder="Water intake daily"
          options={WATER_INTAKE}
          value={form.water}
          onChange={(value) => updateField("water", value)}
        />
      </div>
      <div className="stress-label">Stress level</div>
      <StressSlider
        value={form.stress}
        onChange={(value) => updateField("stress", value)}
      />
      <button
        type="button"
        className="cta"
        onClick={() => goTo("s19")}
      >
        Continue
      </button>
    </div>
  );
}
