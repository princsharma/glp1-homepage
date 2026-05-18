"use client";

import Image from "next/image";
import { useOnboard } from "./OnboardContext";

const DOCTOR = {
  name: "Dr. Vanessa Niles",
  creds: "MD · Board-Certified Internal Medicine",
  photo: "/images/Dr-vanessa-niles.webp",
  bio:
    "With over a decade of clinical experience, Dr. Niles has helped " +
    "thousands of patients build sustainable, science-backed weight-loss " +
    "plans. She takes a personalised approach — combining GLP-1 therapy " +
    "with lifestyle guidance — so you feel supported at every step.",
  tags: ["10+ yrs experience", "Metabolic health", "Telehealth"],
};

export default function S22bDoctor() {
  const { form, updateField, goTo } = useOnboard();
  const isSelected = form.doctor === DOCTOR.name;

  return (
    <div className="sc doc-sc">
      <div className="q doc-q">Meet your physician</div>
      <div className="qs doc-qs">
        Your consultation will be with a licensed, board-certified physician
        who specialises in metabolic health and GLP-1 therapy. Tap the card
        to confirm your match.
      </div>

      <button
        type="button"
        className={`doc-card ${isSelected ? "sel" : ""}`}
        aria-pressed={isSelected}
        onClick={() =>
          updateField("doctor", isSelected ? "" : DOCTOR.name)
        }
      >
        <span className="doc-check" aria-hidden>✓</span>

        <span className="doc-header">
          <span className="doc-photo">
            <Image
              src={DOCTOR.photo}
              alt={DOCTOR.name}
              fill
              sizes="96px"
              priority
              className="doc-photo-img"
            />
          </span>
          <span className="doc-info">
            <span className="doc-name">{DOCTOR.name}</span>
            <span className="doc-creds">{DOCTOR.creds}</span>
          </span>
        </span>

        <span className="doc-divider" aria-hidden />

        <span className="doc-bio">{DOCTOR.bio}</span>

        <span className="doc-tags">
          {DOCTOR.tags.map((tag) => (
            <span key={tag} className="doc-tag">{tag}</span>
          ))}
        </span>
      </button>

      <button
        type="button"
        className="cta"
        disabled={!isSelected}
        onClick={() => goTo("s23")}
      >
        Continue
      </button>
    </div>
  );
}
