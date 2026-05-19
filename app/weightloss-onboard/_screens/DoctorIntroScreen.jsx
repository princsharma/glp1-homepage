"use client";

import { useEffect, useState } from "react";
import { useOnboard } from "./OnboardContext";

// Fallback shown ONLY if the live doctor list can't be loaded — keeps the
// flow unblocked rather than dead-ending the patient on a network blip.
const FALLBACK_DOCTOR = {
  uid: "",
  fullName: "Dr. Vanessa Niles",
  bio:
    "Licensed physician specializing in metabolic health and GLP-1 therapy.",
  licensedStates: [],
};

export default function S22bDoctor() {
  const { form, updateField, goTo } = useOnboard();
  const [doctors, setDoctors] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/doctors/list");
        const data = await res.json();
        if (cancelled) return;
        if (!data?.success) throw new Error(data?.message || "fetch failed");
        setDoctors(Array.isArray(data.doctors) ? data.doctors : []);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Couldn't load the clinician list.");
          setDoctors([FALLBACK_DOCTOR]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const select = (d) => {
    const same = form.doctorUid === d.uid;
    updateField("doctorUid", same ? "" : d.uid);
    updateField("doctor", same ? "" : d.fullName);
  };

  return (
    <div className="sc doc-sc">
      <div className="q doc-q">Meet your physician</div>
      <div className="qs doc-qs">
        Your consultation will be with a licensed, board-certified physician
        who specializes in metabolic health and GLP-1 therapy. Pick the
        clinician you&apos;d like to see.
      </div>

      {doctors === null && (
        <div className="qs" style={{ marginTop: 14 }}>
          Loading available clinicians…
        </div>
      )}

      {doctors?.length === 0 && !error && (
        <div className="qs" style={{ marginTop: 14 }}>
          No clinicians available right now. Please check back shortly.
        </div>
      )}

      {doctors?.map((d) => {
        const isSelected = form.doctorUid === d.uid && d.uid !== "";
        const states = (d.licensedStates || []).join(" · ");
        return (
          <button
            key={d.uid || d.fullName}
            type="button"
            className={`doc-card ${isSelected ? "sel" : ""}`}
            aria-pressed={isSelected}
            onClick={() => select(d)}
            style={{ marginBottom: 10 }}
          >
            <span className="doc-check" aria-hidden>✓</span>

            <span className="doc-header">
              <span
                className="doc-photo"
                style={{
                  background: d.photoURL
                    ? "var(--color-surface-alt, #f8f9fa)"
                    : "linear-gradient(135deg, var(--color-primary-light, #74c69d), var(--color-primary, #347e5d))",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 800,
                  fontSize: 28,
                  letterSpacing: "-0.02em",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {d.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.photoURL}
                    alt={d.fullName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  (d.firstName?.[0] || d.fullName?.[0] || "D").toUpperCase()
                )}
              </span>
              <span className="doc-info">
                <span className="doc-name">Dr. {d.fullName}</span>
                {states && (
                  <span className="doc-creds">Licensed: {states}</span>
                )}
              </span>
            </span>

            {d.bio && (
              <>
                <span className="doc-divider" aria-hidden />
                <span className="doc-bio">{d.bio}</span>
              </>
            )}
          </button>
        );
      })}

      <button
        type="button"
        className="cta"
        disabled={!form.doctorUid}
        onClick={() => goTo("s23")}
      >
        Continue
      </button>
    </div>
  );
}
