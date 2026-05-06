"use client";

import { Radio } from "../components";
import {
  GLP_EXPERIENCE,
  GLP_MEDICATIONS,
  MEDICATION_DOSES,
  YES_NO,
  type GlpMedication,
} from "../data";
import { useOnboard } from "./OnboardContext";
import { ALLOWED_IMAGE_ACCEPT, validateImageUpload } from "./constants";

export function S7() {
  const { form, updateField, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        Have you taken any GLP-1 medications before or are you taking one now?
      </div>
      <Radio
        options={YES_NO}
        value={form.s7}
        onSelect={(value) => updateField("s7", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.s7}
        onClick={() => goTo(form.s7 === "Yes" ? "s7m" : "s7e")}
      >
        Continue
      </button>
    </div>
  );
}

export function S7m() {
  const { form, updateField, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        Which GLP-1 medication have you used or currently using?
      </div>
      <Radio
        options={GLP_MEDICATIONS}
        value={form.glpMed}
        onSelect={(value) => {
          if (value !== form.glpMed) updateField("glpDose", "");
          updateField("glpMed", value);
        }}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.glpMed}
        onClick={() => goTo("s7b")}
      >
        Continue
      </button>
    </div>
  );
}

export function S7b() {
  const { form, updateField, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        What dose of {form.glpMed} are you taking or have you taken?
      </div>
      <Radio
        options={MEDICATION_DOSES[form.glpMed as GlpMedication] ?? []}
        value={form.glpDose}
        onSelect={(value) => updateField("glpDose", value)}
      />
      <div className="qs">
        Please share how many units of medication you are drawing up
        with each injection, and how often you inject.
      </div>
      <textarea
        className="inp"
        placeholder="Please specify"
        value={form.glpDoseDetails ?? ""}
        onChange={(event) => updateField("glpDoseDetails", event.target.value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.glpDose}
        onClick={() => goTo("s7a")}
      >
        Continue
      </button>
    </div>
  );
}

export function S7a() {
  const { form, updateField, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        How was your experience with GLP-1 medications?
      </div>
      <Radio
        options={GLP_EXPERIENCE}
        value={form.glpExperience}
        onSelect={(value) => updateField("glpExperience", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.glpExperience}
        onClick={() => goTo("s7c")}
      >
        Continue
      </button>
    </div>
  );
}

export function S7c() {
  const { form, updateField, goTo, todayDate } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        What was the date of your last injection (Month/Day/Year)?
      </div>
      <input
        className="inp"
        type="date"
        max={todayDate}
        value={form.glpLastInjection ?? ""}
        onChange={(event) => updateField("glpLastInjection", event.target.value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!form.glpLastInjection}
        onClick={() => goTo("s7d")}
      >
        Continue
      </button>
    </div>
  );
}

export function S7d() {
  const { form, updateField, goTo, uploadError, setUploadError } = useOnboard();

  return (
    <div className="sc">
      <div className="q" style={{ fontSize: 17, fontWeight: 600 }}>
        If you have a photo of your current medication or prescription,
        you can upload it here. Please make sure your name and dosing
        details are visible.
      </div>
      <label className="cta2 upload-btn">
        ⬆ Upload file
        <input
          type="file"
          accept={ALLOWED_IMAGE_ACCEPT}
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const err = validateImageUpload(file);
            if (err) {
              setUploadError(err);
              return;
            }
            setUploadError("");
            updateField("vialPhotoName", file.name);
          }}
        />
      </label>
      {form.vialPhotoName && (
        <div className="upload-name">✓ {form.vialPhotoName}</div>
      )}
      {uploadError && (
        <div className="field-err">{uploadError}</div>
      )}
      <button
        type="button"
        className="cta"
        onClick={() => goTo("s7e")}
      >
        Continue
      </button>
    </div>
  );
}
