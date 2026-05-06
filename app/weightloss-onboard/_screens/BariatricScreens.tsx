"use client";

import { Multi } from "../components";
import { BARIATRIC_PROCEDURES } from "../data";
import { buildSurgeryListText } from "../utils";
import { useOnboard } from "./OnboardContext";

export function S9() {
  const { form, toggleWithNone, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        Have you had any weight loss surgery in the past?
      </div>
      <div className="qs">Select all that apply.</div>
      <Multi
        options={BARIATRIC_PROCEDURES}
        values={form.s9}
        onToggle={(value) =>
          toggleWithNone("s9", value, "None of these")
        }
      />
      <button
        type="button"
        className="cta"
        disabled={form.s9.length === 0}
        onClick={() =>
          goTo(
            form.s9.some((procedure) => procedure !== "None of these")
              ? "s9b"
              : "s10",
          )
        }
      >
        Continue
      </button>
    </div>
  );
}

export function S9b() {
  const { form, updateField, goTo } = useOnboard();
  const realProcedures = form.s9.filter(
    (procedure) => procedure !== "None of these",
  );
  const { list, word } = buildSurgeryListText(realProcedures);
  const value = form.bariDate ?? "";

  return (
    <div className="sc">
      <div className="q">
        When was your {list} {word}?
      </div>
      <textarea
        className="inp"
        value={value}
        onChange={(event) => updateField("bariDate", event.target.value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!value.trim()}
        onClick={() => goTo("s10")}
      >
        Continue
      </button>
    </div>
  );
}
