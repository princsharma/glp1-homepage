// app/dashboard/patient/page.jsx
//
// Overview — hero banner + quick-stat tiles + onboarding progress + next
// appointment summary. Pulls everything from the live Firestore subscription
// in useAuthUser, so any data captured during onboarding shows up here in
// real time.

"use client";

import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import styles from "./dashboard.module.css";

// Mirrors PROGRESS_ORDER in WeightlossOnboardForm.jsx. Inlined rather than
// imported to keep the dashboard bundle independent of the onboarding form
// module. If the form ever gains/loses screens, refresh this list.
const PROGRESS_ORDER = [
  "s1", "s2", "s3", "iGood", "s20", "iRoad",
  "s4", "s5", "s6",
  "s7", "s7m", "s7b", "s7a", "s7c", "s7d", "s7e",
  "s9", "s9b",
  "s10", "s11",
  "s12", "s13", "s13a", "s14", "s14b", "s15",
  "s16", "s17", "s18",
  "s19", "s21", "s22", "s22b", "s23",
  "sPlan", "sPay", "iConfirm",
];

const PLAN_LABELS = {
  "1m": "1-month program",
  "3m": "3-month program",
  "6m": "6-month program",
};

export default function PatientOverview() {
  const { profile, user } = useAuthUser();

  const onb = profile?.onboarding || {};
  const isComplete = profile?.status === "onboarded";
  const planLabel = PLAN_LABELS[onb.plan] || onb.plan || "—";

  const [slotDate, slotTime] = (onb.slot || "").split("|");
  const hasAppt = !!(slotDate || onb.doctor);

  // BMI + category for the gauge
  const bmi = computeBmi(onb);
  const bmiPct = bmiToPercent(bmi);
  const bmiCat = bmiCategory(bmi);
  const goalLbs = Number(onb.wtGoal) || null;
  const currentLbs = Number(onb.weightLbs) || null;

  // Onboarding progress
  const stepIndex = profile?.currentStep
    ? PROGRESS_ORDER.indexOf(profile.currentStep)
    : -1;
  const progressPct = isComplete
    ? 100
    : stepIndex >= 0
      ? Math.round(((stepIndex + 1) / PROGRESS_ORDER.length) * 100)
      : 0;

  const greetingName = profile?.firstName
    ? `, ${profile.firstName}`
    : "";

  return (
    <>
      {/* ===== Hero ===== */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.heroKicker}>
              <DotIcon />
              Patient dashboard
            </span>
            <h1 className={styles.heroTitle}>
              Welcome back{greetingName}.
            </h1>
            <p className={styles.heroSubtitle}>
              {isComplete
                ? "You're all set. Your care team has your intake and your consultation is on the books."
                : "Here's a quick look at your journey so far — pick up wherever you left off."}
            </p>
          </div>
          <div className={styles.heroActions}>
            {!isComplete ? (
              <Link href="/weightloss-onboard" className={styles.ctaPrimary}>
                Resume onboarding
                <ArrowRight />
              </Link>
            ) : (
              <Link
                href="/dashboard/patient/appointments"
                className={styles.ctaPrimary}
              >
                View appointment
                <ArrowRight />
              </Link>
            )}
            <Link
              href="/dashboard/patient/health"
              className={styles.ctaSecondary}
            >
              Health profile
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Stat tiles ===== */}
      <div className={styles.statRow}>
        <StatTile
          icon={<ProgressIcon />}
          tone="green"
          label="Onboarding"
          value={
            isComplete ? (
              <span className={`${styles.pill} ${styles.pillOk}`}>Complete</span>
            ) : (
              <span className={`${styles.pill} ${styles.pillPending}`}>
                {progressPct}% done
              </span>
            )
          }
          sub={
            isComplete ? "Submitted to your doctor." : `Last step: ${profile?.currentStep || "—"}`
          }
        />

        <StatTile
          icon={<CardIcon />}
          tone={onb.paid ? "green" : "amber"}
          label="Current plan"
          value={planLabel}
          sub={
            onb.paid ? (
              <span className={`${styles.pill} ${styles.pillOk}`}>Paid</span>
            ) : (
              <span className={`${styles.pill} ${styles.pillWarn}`}>
                Awaiting payment
              </span>
            )
          }
        />

        <StatTile
          icon={<HeartPulseIcon />}
          tone="coral"
          label="BMI"
          value={bmi != null ? bmi.toFixed(1) : "—"}
          sub={
            bmi != null
              ? <span className={`${styles.pill} ${styles.pillNeutral}`}>{bmiCat.label}</span>
              : "Not enough data yet"
          }
        />

        <StatTile
          icon={<TargetIcon />}
          tone="slate"
          label="Goal"
          value={goalLbs ? `${goalLbs} lbs` : "—"}
          sub={
            currentLbs && goalLbs
              ? `From ${currentLbs} lbs · ${diffText(currentLbs, goalLbs)}`
              : "Set during onboarding"
          }
        />
      </div>

      {/* ===== Two-column: onboarding progress + appointment ===== */}
      <div className={styles.colSplit}>
        {/* Onboarding progress card */}
        <section className={`${styles.card} ${styles.cardHover}`}>
          <div className={styles.cardEyebrow}>
            <ProgressIcon /> Your onboarding
          </div>
          <h2 className={styles.cardTitle}>
            {isComplete ? "All done — thank you!" : "In progress"}
          </h2>
          <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>
            {isComplete
              ? "Your intake is locked in. Your doctor will review it before your consultation."
              : "Finish your intake whenever you're ready. We save your progress automatically."}
          </p>

          <div className={styles.progressWrap}>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className={styles.progressMeta}>
              <span>{isComplete ? "Complete" : `Step ${stepIndex + 1} of ${PROGRESS_ORDER.length}`}</span>
              <span>{progressPct}%</span>
            </div>
          </div>

          {!isComplete && (
            <Link
              href="/weightloss-onboard"
              className={styles.ctaPrimary}
              style={{ marginTop: 18 }}
            >
              Continue where I left off
              <ArrowRight />
            </Link>
          )}

          {bmi != null && (
            <div style={{ marginTop: 24 }}>
              <div className={styles.cardEyebrow}>
                <HeartPulseIcon /> BMI category
              </div>
              <div className={styles.bmiGauge}>
                <div className={styles.bmiBar} aria-hidden>
                  <div
                    className={styles.bmiMarker}
                    style={{ left: `${bmiPct}%`, borderColor: bmiCat.color }}
                    title={`BMI ${bmi.toFixed(1)} — ${bmiCat.label}`}
                  />
                </div>
                <div className={styles.bmiLabels}>
                  <span>Under</span>
                  <span>Healthy</span>
                  <span>Over</span>
                  <span>Obese</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Next appointment */}
        <section className={`${styles.card} ${styles.cardHover}`}>
          <div className={styles.cardEyebrow}>
            <CalendarIcon /> Next appointment
          </div>
          {hasAppt ? (
            <>
              <h2 className={styles.cardTitle} style={{ marginBottom: 6 }}>
                {slotDate || "Time TBD"}
              </h2>
              {slotTime && (
                <div style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
                  {slotTime} · Video call
                </div>
              )}
              <div className={styles.row} style={{ marginTop: 12 }}>
                <span className={styles.rowLabel}>Doctor</span>
                <span className={styles.rowValue}>{onb.doctor || "TBD"}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Status</span>
                <span className={styles.rowValue}>
                  <span className={`${styles.pill} ${styles.pillOk}`}>Confirmed</span>
                </span>
              </div>
              <Link
                href="/dashboard/patient/appointments"
                className={styles.ctaSecondary}
                style={{ marginTop: 14 }}
              >
                View details
              </Link>
            </>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIllus}>
                <CalendarIcon />
              </div>
              <div className={styles.emptyTitle}>No appointment yet</div>
              <div className={styles.emptyBody}>
                Finish your onboarding to pick a time with one of our doctors.
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ===== Account summary ===== */}
      <section className={styles.card} style={{ marginTop: 16 }}>
        <div className={styles.cardEyebrow}>
          <UserIcon /> Your account
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Email</span>
          <span className={styles.rowValue}>
            {profile?.email || user?.email || "—"}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Role</span>
          <span className={styles.rowValue}>
            <span className={`${styles.pill} ${styles.pillOk}`}>Patient</span>
          </span>
        </div>
      </section>
    </>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function StatTile({ icon, tone, label, value, sub }) {
  const toneClass =
    {
      green: styles.statIconGreen,
      coral: styles.statIconCoral,
      slate: styles.statIconSlate,
      amber: styles.statIconAmber,
    }[tone] || styles.statIconSlate;
  return (
    <div className={styles.stat}>
      <div className={`${styles.statIcon} ${toneClass}`}>{icon}</div>
      <div className={styles.statBody}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statSub}>{sub}</div>
      </div>
    </div>
  );
}

function diffText(current, goal) {
  const diff = current - goal;
  if (diff === 0) return "you're there!";
  return diff > 0 ? `${diff} lbs to lose` : `${Math.abs(diff)} lbs to gain`;
}

function bmiCategory(bmi) {
  if (bmi == null) return { label: "—", color: "#94a3b8" };
  if (bmi < 18.5) return { label: "Underweight", color: "#3b82f6" };
  if (bmi < 25) return { label: "Healthy", color: "#10b981" };
  if (bmi < 30) return { label: "Overweight", color: "#f59e0b" };
  return { label: "Obese", color: "#ef4444" };
}

// Map BMI 15..40 onto 0..100% for the gauge marker position.
function bmiToPercent(bmi) {
  if (bmi == null) return 0;
  const clamped = Math.max(15, Math.min(40, bmi));
  return ((clamped - 15) / (40 - 15)) * 100;
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

/* ─── Icons ──────────────────────────────────────────────────────────── */
function iconProps(size = 16) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
}

function ArrowRight() {
  return (
    <svg {...iconProps(14)}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 5 20 12 13 19" />
    </svg>
  );
}
function DotIcon() {
  return (
    <svg {...iconProps(8)}>
      <circle cx="12" cy="12" r="6" fill="currentColor" stroke="none" />
    </svg>
  );
}
function ProgressIcon() {
  return (
    <svg {...iconProps(20)}>
      <path d="M21 12a9 9 0 11-9-9" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  );
}
function CardIcon() {
  return (
    <svg {...iconProps(20)}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <line x1="3" y1="11" x2="21" y2="11" />
    </svg>
  );
}
function HeartPulseIcon() {
  return (
    <svg {...iconProps(20)}>
      <path d="M3 12h4l2 6 4-12 2 6h6" />
    </svg>
  );
}
function TargetIcon() {
  return (
    <svg {...iconProps(20)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
