"use client";

import { BmiGauge } from "../components";
import { eligibilityText } from "../utils";
import { useOnboard } from "./OnboardContext";
import { BMI_CATEGORY_CARDS } from "./constants";

export default function S3Bmi() {
  const {
    form,
    updateField,
    goTo,
    bmi,
    bmiError,
    currentBmiCategory,
    setBmiUnit,
    submitMauticOnComplete,
  } = useOnboard();

  return (
    <div className="sc bmi-screen">
      <div className="bmi-eyebrow">Step 1 · Eligibility check</div>
      <div className="q bmi-q">Let&apos;s check if GLP-1 is right for you</div>
      <div className="qs bmi-qs">
        Your height and weight help us calculate your BMI — a key factor in eligibility.
      </div>

      <div className="bmi-shell">
        <div className="unit-toggle bmi-toggle">
          <button
            type="button"
            className={form.bmiUnit === "imperial" ? "active" : ""}
            onClick={() => setBmiUnit("imperial")}
          >
            Imperial (ft / lbs)
          </button>
          <button
            type="button"
            className={form.bmiUnit === "metric" ? "active" : ""}
            onClick={() => setBmiUnit("metric")}
          >
            Metric (cm / kg)
          </button>
        </div>

        {form.bmiUnit === "metric" ? (
          <div className="bmi-fields">
            <div className="bmi-field">
              <label className="bmi-field-label">Height</label>
              <div className="bmi-field-input">
                <input
                  className="inp bmi-inp"
                  type="number"
                  inputMode="numeric"
                  min={61}
                  max={274}
                  placeholder="0"
                  value={form.heightCm}
                  onChange={(event) => updateField("heightCm", event.target.value)}
                />
                <span className="bmi-unit">cm</span>
              </div>
            </div>
            <div className="bmi-field">
              <label className="bmi-field-label">Weight</label>
              <div className="bmi-field-input">
                <input
                  className="inp bmi-inp"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={500}
                  placeholder="0"
                  value={form.weightKg}
                  onChange={(event) => updateField("weightKg", event.target.value)}
                />
                <span className="bmi-unit">kg</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bmi-fields">
            <div className="bmi-field">
              <label className="bmi-field-label">Height</label>
              <div className="bmi-field-pair">
                <div className="bmi-field-input">
                  <input
                    className="inp bmi-inp"
                    type="number"
                    inputMode="numeric"
                    min={2}
                    max={9}
                    placeholder="0"
                    value={form.heightFt}
                    onChange={(event) => updateField("heightFt", event.target.value)}
                  />
                  <span className="bmi-unit">ft</span>
                </div>
                <div className="bmi-field-input">
                  <input
                    className="inp bmi-inp"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={11}
                    placeholder="0"
                    value={form.heightIn}
                    onChange={(event) => updateField("heightIn", event.target.value)}
                  />
                  <span className="bmi-unit">in</span>
                </div>
              </div>
            </div>
            <div className="bmi-field">
              <label className="bmi-field-label">Weight</label>
              <div className="bmi-field-input">
                <input
                  className="inp bmi-inp"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={1100}
                  placeholder="0"
                  value={form.weightLbs}
                  onChange={(event) => updateField("weightLbs", event.target.value)}
                />
                <span className="bmi-unit">lbs</span>
              </div>
            </div>
          </div>
        )}

        {bmiError && <div className="field-err">{bmiError}</div>}

        <div
          className={`bmi-gauge-shell${
            currentBmiCategory && !bmiError
              ? ` bmi-gauge-shell-${currentBmiCategory}`
              : ""
          }`}
        >
          <BmiGauge
            bmi={bmiError ? null : bmi}
            category={bmiError ? null : currentBmiCategory}
          />
        </div>

        {bmi !== null && !bmiError && (
          <div
            className={`bmi-pill bmi-pill-center bmi-pill-${currentBmiCategory ?? "none"}`}
          >
            {eligibilityText(bmi)}
          </div>
        )}

        <div className="cat-row">
          {BMI_CATEGORY_CARDS.map((category) => (
            <div
              key={category.key}
              className={`cat-card cat-card-${category.key} ${currentBmiCategory === category.key ? "active" : ""}`}
            >
              <div className="cat-name">{category.name}</div>
              <div className="cat-range">{category.range}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="cta"
        disabled={bmi === null || bmiError !== null}
        onClick={() => {
          if (bmi !== null && bmi < 27) {
            submitMauticOnComplete({}, "dHard");
            goTo("dHard");
          } else {
            goTo("iGood");
          }
        }}
      >
        Continue
      </button>
    </div>
  );
}
