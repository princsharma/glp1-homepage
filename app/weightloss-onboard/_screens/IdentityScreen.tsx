"use client";

import { useOnboard } from "./OnboardContext";
import { ALLOWED_IMAGE_ACCEPT, validateImageUpload } from "./constants";

export default function S7eIdentity() {
  const { form, updateField, goTo, uploadError, setUploadError } = useOnboard();

  return (
    <div className="sc">
      <div className="q">Upload your photo ID</div>
      <div className="qs">
        A government-issued ID (driver&apos;s license, passport, or state ID) helps verify your identity.
      </div>

      <div className="id-card">
        <div className="id-card-illus" aria-hidden>
          <svg viewBox="0 0 64 48" width="56" height="42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="60" height="44" rx="6" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="18" cy="22" r="6" stroke="currentColor" strokeWidth="2.5" />
            <path d="M10 38c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="34" y1="16" x2="56" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="34" y1="24" x2="56" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="34" y1="32" x2="48" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="id-card-tips">
          <div className="id-tip">
            <span className="id-tip-icon">✓</span>
            <span>Clearly shows your entire ID</span>
          </div>
          <div className="id-tip">
            <span className="id-tip-icon">✓</span>
            <span>Not cropped, blurry, or dark</span>
          </div>
          <div className="id-tip">
            <span className="id-tip-icon">🔒</span>
            <span>Only your healthcare team will see this</span>
          </div>
        </div>
      </div>

      {form.photoIdName && (
        <div className="upload-name">✓ {form.photoIdName}</div>
      )}
      {uploadError && (
        <div className="field-err">{uploadError}</div>
      )}

      <div className="id-actions">
        <label className="cta2 id-btn">
          📁 Select photo
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
              updateField("photoIdName", file.name);
            }}
          />
        </label>
        <label className="cta2 id-btn id-btn-primary">
          📷 Take photo
          <input
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            capture="environment"
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
              updateField("photoIdName", file.name);
            }}
          />
        </label>
      </div>
      <button
        type="button"
        className="cta"
        disabled={!form.photoIdName}
        onClick={() => goTo("s9")}
      >
        Continue
      </button>
    </div>
  );
}
