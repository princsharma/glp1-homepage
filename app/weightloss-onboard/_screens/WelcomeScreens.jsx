"use client";

import { Multi } from "../components";
import { INSPIRATIONS } from "../data";
import { useOnboard } from "./OnboardContext";
import { WEIGHT_GOAL_CARDS } from "./constants";

export function S1Welcome() {
  const { form, updateField, goTo } = useOnboard();

  return (
    <div className="welcome">
      <div className="welcome-hero">
        <div className="welcome-hero-text">
          <span className="welcome-pill">
            <span className="welcome-pill-dot" />
            2 minute quiz
          </span>
          <h1 className="welcome-title">
            Let&apos;s <em>personalize</em><br />your treatment
          </h1>
          <p className="welcome-sub">
            Answer a few quick questions to match you with the right plan.
          </p>
        </div>
        <div className="welcome-hero-art" aria-hidden>
          <div className="welcome-vial">
            <div className="welcome-vial-cap" />
            <div className="welcome-vial-body">
              <div className="welcome-vial-label">GLP-1</div>
              <div className="welcome-vial-sub">Compounded</div>
            </div>
          </div>
        </div>
      </div>

      <div className="welcome-card">
        <div className="welcome-q">How much weight would you like to lose?</div>
        <div className="welcome-opts">
          {WEIGHT_GOAL_CARDS.map((card) => {
            const isSelected = form.s1 === card.value;
            return (
              <button
                key={card.value}
                type="button"
                className={`welcome-opt ${isSelected ? "sel" : ""}`}
                onClick={() => updateField("s1", card.value)}
              >
                <span className="welcome-opt-text">
                  <span className="welcome-opt-title">{card.value}</span>
                  <span className="welcome-opt-desc">{card.desc}</span>
                </span>
                <span className="welcome-opt-arrow" aria-hidden>→</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="cta welcome-cta"
          disabled={!form.s1}
          onClick={() => goTo("s2")}
        >
          Continue
        </button>
        <div className="welcome-foot">
          Already a member? <a href="/login">Sign In</a>
        </div>
      </div>
    </div>
  );
}

export function S2Inspiration() {
  const { form, toggleValue, goTo } = useOnboard();

  return (
    <div className="welcome">
      <div className="welcome-hero">
        <div className="welcome-hero-text">
          <span className="welcome-pill">
            <span className="welcome-pill-dot" />
            Almost there
          </span>
          <h1 className="welcome-title">
            What&apos;s <em>driving you</em><br />right now?
          </h1>
          <p className="welcome-sub">
            Tell us what matters most so we can tailor your plan.
          </p>
        </div>
        <div className="welcome-hero-art" aria-hidden>
          <div className="welcome-vial">
            <div className="welcome-vial-cap" />
            <div className="welcome-vial-body">
              <div className="welcome-vial-label">GLP-1</div>
              <div className="welcome-vial-sub">Compounded</div>
            </div>
          </div>
        </div>
      </div>

      <div className="welcome-card">
        <div className="welcome-q">What&apos;s making you want to start now?</div>
        <div className="welcome-q-sub">Select all that apply.</div>
        <Multi
          options={INSPIRATIONS}
          values={form.s2}
          onToggle={(value) => toggleValue("s2", value)}
        />
        <button
          type="button"
          className="cta welcome-cta"
          disabled={form.s2.length === 0}
          onClick={() => goTo("s20")}
        >
          Continue
        </button>
        <div className="welcome-foot">
          Already a member? <a href="/login">Sign In</a>
        </div>
      </div>
    </div>
  );
}
