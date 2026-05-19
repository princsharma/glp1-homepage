// app/dashboard/doctor/patients/[uid]/page.jsx
//
// Patient deep-dive for the doctor. Pulls users/{uid} + the doctor's
// appointments with this patient via /api/doctor/patients/[uid] and lays
// every captured field out in clinically useful groupings.

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { auth } from "@/lib/firebase/auth";
import styles from "../../../patient/dashboard.module.css";
import local from "./detail.module.css";

const PLAN_LABELS = {
  "1m": "1-month program",
  "3m": "3-month program",
  "6m": "6-month program",
};

// Friendly labels for the cryptic onboarding screen IDs (s10, s11, etc.).
// Falls back to the key itself if not in this map.
const FIELD_LABELS = {
  s1: "Why they joined",
  s2: "Motivators",
  s5: "Recent weight trend",
  s6: "Weight-affecting events",
  s7: "GLP-1 experience",
  s9: "Bariatric history",
  s10: "Chronic conditions",
  s11: "Other conditions",
  s11Other: "Conditions — other (free text)",
  s12: "Contraindication risks",
  s13: "Hospitalizations",
  s14: "Pregnancy / lactation",
  s15: "Family history",
  s16: "Exercise routine",
  s17: "Eating habits",
  s17Other: "Eating habits — other",
  s19: "Goals & barriers",
  meals: "Meals per day",
  exercise: "Exercise frequency",
  sleep: "Sleep hours",
  fastFood: "Fast food / week",
  sugary: "Sugary drinks / week",
  water: "Water / day",
  stress: "Stress level (1-10)",
  glpExperience: "Prior GLP-1 experience",
  glpMed: "Prior GLP-1 medication",
  glpDose: "Prior GLP-1 dose",
  glpDoseDetails: "Dose details",
  glpLastInjection: "Last injection",
  pregnancyConsent: "Pregnancy consent",
};

export default function PatientDetailPage() {
  const { uid } = useParams();
  const { user } = useAuthUser();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !uid) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/doctor/patients/${uid}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data?.success) throw new Error(data?.message || "fetch failed");
        setPatient(data.patient);
      } catch (e) {
        if (!cancelled) setError(e?.message || "fetch failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, uid]);

  if (loading) {
    return (
      <section className={styles.card}>
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading patient…</p>
      </section>
    );
  }
  if (error || !patient) {
    return (
      <section className={styles.card}>
        <p style={{ color: "#b45309", margin: 0 }}>
          {error || "Patient not found."}
        </p>
        <Link href="/dashboard/doctor/patients" className={styles.ctaSecondary} style={{ marginTop: 12 }}>
          ← Back to patients
        </Link>
      </section>
    );
  }

  const onb = patient.onboarding || {};
  const bmi = computeBmi(onb);
  const age = computeAge(patient.dob);
  const planLabel = PLAN_LABELS[onb.plan] || onb.plan || "—";

  return (
    <>
      <Link href="/dashboard/doctor/patients" className={local.backLink}>
        ← Back to patients
      </Link>

      {/* ===== Header card ===== */}
      <section className={local.headerCard}>
        <div className={local.headerInner}>
          <div className={local.headerAvatar}>
            {(patient.firstName?.[0] || patient.fullName?.[0] || "?").toUpperCase()}
          </div>
          <div className={local.headerInfo}>
            <h1 className={local.headerName}>{patient.fullName}</h1>
            <div className={local.headerMeta}>
              <span>{age != null ? `${age} years old` : "Age unknown"}</span>
              {onb.sexAtBirth && <span>· {capitalize(onb.sexAtBirth)}</span>}
              {patient.dob && <span>· DOB {patient.dob}</span>}
            </div>
            <div className={local.contactRow}>
              <a href={`mailto:${patient.email}`} className={local.contactChip}>
                ✉ {patient.email}
              </a>
              {patient.phone && (
                <a href={`tel:${patient.phone}`} className={local.contactChip}>
                  ☎ {patient.phone}
                </a>
              )}
              {onb.zip && (
                <span className={local.contactChip}>📍 ZIP {onb.zip}</span>
              )}
            </div>
          </div>
          <div className={local.headerStatus}>
            <span
              className={`${styles.pill} ${patient.status === "onboarded" ? styles.pillOk : styles.pillWarn}`}
            >
              {patient.status === "onboarded" ? "Onboarded" : "Onboarding"}
            </span>
            <span
              className={`${styles.pill} ${onb.paid ? styles.pillOk : styles.pillWarn}`}
            >
              {onb.paid ? "Paid" : "Awaiting payment"}
            </span>
          </div>
        </div>
      </section>

      {/* ===== Stat tiles ===== */}
      <div className={styles.statRow}>
        <StatTile
          tone="coral"
          label="BMI"
          value={bmi != null ? bmi.toFixed(1) : "—"}
          sub={bmi != null ? bmiCategory(bmi) : "Not enough data"}
        />
        <StatTile
          tone="slate"
          label="Current weight"
          value={
            onb.weightLbs ? `${onb.weightLbs} lbs` : onb.weightKg ? `${onb.weightKg} kg` : "—"
          }
          sub={onb.heightFt ? `${onb.heightFt}'${onb.heightIn || 0}"` : onb.heightCm ? `${onb.heightCm} cm` : ""}
        />
        <StatTile
          tone="green"
          label="Goal weight"
          value={onb.wtGoal ? `${onb.wtGoal} lbs` : "—"}
          sub={
            onb.weightLbs && onb.wtGoal
              ? `${Math.max(0, Number(onb.weightLbs) - Number(onb.wtGoal))} lbs to lose`
              : ""
          }
        />
        <StatTile
          tone="amber"
          label="Plan"
          value={planLabel}
          sub={onb.paid ? "Active" : "Not paid"}
        />
      </div>

      {/* ===== Two-column body ===== */}
      <div className={styles.colSplit}>
        <div className={styles.stack}>
          {/* Medications */}
          <Card eyebrow="Medications & allergies" title="Current pharmacology">
            <Row label="Current medications" value={onb.meds} multiline />
            <Row label="Allergies" value={onb.allergies} multiline />
            <Row label="Preferred pharmacy" value={onb.pharmacy} />
          </Card>

          {/* GLP-1 history */}
          <Card eyebrow="GLP-1 history" title="Prior treatment exposure">
            <Row label="Has used a GLP-1 before" value={onb.s7} />
            <Row label="Specific experience" value={onb.glpExperience} />
            <Row label="Medication tried" value={onb.glpMed} />
            <Row label="Dose" value={onb.glpDose} />
            <Row label="Dose details" value={onb.glpDoseDetails} multiline />
            <Row label="Last injection" value={onb.glpLastInjection} />
          </Card>

          {/* Medical history */}
          <Card eyebrow="Medical history" title="Conditions & safety screen">
            <Row label="Chronic conditions" value={onb.s10} />
            <Row label="Other conditions" value={onb.s11} />
            <Row label="Other conditions (detail)" value={onb.s11Other} multiline />
            <Row label="Contraindication risks" value={onb.s12} />
            <Row label="Hospitalizations" value={onb.s13} />
            <Row label="Pregnancy / lactation" value={onb.s14} />
            <Row label="Pregnancy consent" value={onb.pregnancyConsent ? "Yes" : "—"} />
            <Row label="Family history" value={onb.s15} />
            <Row label="Bariatric history" value={onb.s9} />
            <Row label="Bariatric procedure date" value={onb.bariDate} />
          </Card>
        </div>

        <div className={styles.stack}>
          {/* Account snapshot */}
          <Card eyebrow="Account" title="Profile & consents">
            <Row label="Email" value={patient.email} />
            <Row
              label="Email verified"
              value={
                patient.emailVerified ? (
                  <span className={`${styles.pill} ${styles.pillOk}`}>Yes</span>
                ) : (
                  <span className={`${styles.pill} ${styles.pillWarn}`}>No</span>
                )
              }
            />
            <Row label="Phone" value={patient.phone} />
            <Row label="DOB" value={patient.dob} />
            <Row label="ZIP" value={onb.zip} />
            <Row label="Address" value={onb.address} multiline />
            <Row label="Sex at birth" value={onb.sexAtBirth} />
            <Row label="HIPAA consent" value={patient.consentHIPAA ? "Signed" : "—"} />
            <Row label="Telehealth consent" value={patient.consentTelehealth ? "Signed" : "—"} />
            <Row label="Registered" value={formatDate(patient.createdAtMs)} />
          </Card>

          {/* Lifestyle */}
          <Card eyebrow="Lifestyle" title="Day-to-day habits">
            <Row label="Meals per day" value={onb.meals} />
            <Row label="Exercise" value={onb.exercise} />
            <Row label="Sleep" value={onb.sleep} />
            <Row label="Fast food / week" value={onb.fastFood} />
            <Row label="Sugary drinks / week" value={onb.sugary} />
            <Row label="Water / day" value={onb.water} />
            <Row label="Stress (1–10)" value={onb.stress} />
            <Row label="Exercise routine" value={onb.s16} />
            <Row label="Eating habits" value={onb.s17} />
            <Row label="Other eating habits" value={onb.s17Other} multiline />
            <Row label="Goals & barriers" value={onb.s19} />
          </Card>

          {/* Payment */}
          {onb.paid && (
            <Card eyebrow="Billing" title="Most recent payment">
              <Row
                label="Amount"
                value={
                  onb.paymentAmount != null
                    ? new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: (onb.paymentCurrency || "usd").toUpperCase(),
                      }).format(onb.paymentAmount / 100)
                    : "—"
                }
              />
              <Row
                label="Card"
                value={
                  onb.paymentLast4
                    ? `${capitalize(onb.paymentBrand || "Card")} •••• ${onb.paymentLast4}`
                    : "—"
                }
              />
              <Row label="Paid" value={formatDate(onb.paidAt)} />
              <Row label="Reference" value={onb.paymentIntentId} mono />
            </Card>
          )}
        </div>
      </div>

      {/* ===== Appointments ===== */}
      <Card eyebrow="Visits" title="Appointments with you" style={{ marginTop: 16 }}>
        {patient.appointments?.length ? (
          <div className={local.apptList}>
            {patient.appointments.map((a) => (
              <div key={a.id} className={local.appt}>
                <div className={local.apptWhen}>
                  <div className={local.apptDate}>
                    {formatIsoDate(a.date)}
                  </div>
                  <div className={local.apptTime}>{formatIsoTime(a.time)}</div>
                </div>
                <div className={local.apptBody}>
                  <div className={local.apptType}>{a.type || "Consultation"}</div>
                  {a.notes ? (
                    <div className={local.apptNotes}>{a.notes}</div>
                  ) : (
                    <div className={local.apptNotesEmpty}>No notes yet.</div>
                  )}
                </div>
                <span
                  className={`${styles.pill} ${
                    a.status === "completed"
                      ? styles.pillOk
                      : a.status === "cancelled"
                        ? styles.pillWarn
                        : styles.pillNeutral
                  }`}
                >
                  {capitalize(a.status)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            No appointments on the books yet.
          </p>
        )}
      </Card>

      {/* ===== Raw onboarding dump ===== */}
      <details className={local.rawDump}>
        <summary>Full onboarding response (raw)</summary>
        <div className={local.rawTable}>
          {Object.entries(onb)
            .filter(([, v]) => v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0))
            .map(([k, v]) => (
              <div key={k} className={local.rawRow}>
                <span className={local.rawKey}>{FIELD_LABELS[k] || k}</span>
                <span className={local.rawVal}>{stringifyValue(v)}</span>
              </div>
            ))}
        </div>
      </details>
    </>
  );
}

/* ─── Components ─────────────────────────────────────────────────────── */

function Card({ eyebrow, title, children, style }) {
  return (
    <section className={styles.card} style={style}>
      <div className={styles.cardEyebrow}>{eyebrow}</div>
      <h2 className={styles.cardTitle}>{title}</h2>
      <div style={{ marginTop: 6 }}>{children}</div>
    </section>
  );
}

function Row({ label, value, multiline, mono }) {
  const display = stringifyValue(value);
  if (!display) return null;
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span
        className={styles.rowValue}
        style={{
          ...(multiline ? { whiteSpace: "pre-wrap" } : {}),
          ...(mono ? { fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 } : {}),
          textAlign: "right",
          maxWidth: "60%",
        }}
      >
        {typeof value === "string" || typeof value === "number" ? display : value}
      </span>
    </div>
  );
}

function StatTile({ tone, label, value, sub }) {
  const toneClass =
    {
      green: styles.statIconGreen,
      coral: styles.statIconCoral,
      slate: styles.statIconSlate,
      amber: styles.statIconAmber,
    }[tone] || styles.statIconSlate;
  return (
    <div className={styles.stat}>
      <div className={`${styles.statIcon} ${toneClass}`} aria-hidden />
      <div className={styles.statBody}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statSub}>{sub}</div>
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function stringifyValue(v) {
  if (v == null || v === "") return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function computeAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function computeBmi(onb) {
  if (!onb) return null;
  if (onb.bmiUnit === "metric") {
    const cm = parseFloat(onb.heightCm) || 0;
    const kg = parseFloat(onb.weightKg) || 0;
    if (cm <= 0 || kg <= 0) return null;
    const m = cm / 100;
    return kg / (m * m);
  }
  const feet = parseFloat(onb.heightFt) || 0;
  const inches = parseFloat(onb.heightIn) || 0;
  const pounds = parseFloat(onb.weightLbs) || 0;
  if (feet <= 0 || pounds <= 0) return null;
  const total = feet * 12 + inches;
  if (total <= 0) return null;
  return (pounds * 703) / (total * total);
}

function bmiCategory(bmi) {
  if (bmi == null) return "—";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function formatDate(ms) {
  if (!ms) return "";
  const date =
    typeof ms === "number" ? new Date(ms) :
    typeof ms?.toMillis === "function" ? new Date(ms.toMillis()) :
    new Date(ms);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatIsoDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatIsoTime(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return hhmm || "";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
