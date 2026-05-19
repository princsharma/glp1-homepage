// app/dashboard/patient/appointments/page.jsx
//
// Patient's appointment list. Reads from the appointments collection via
// /api/patient/appointments. Falls back to the onboarding `slot` + `doctor`
// fields for legacy records that pre-date the collection.

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { auth } from "@/lib/firebase/auth";
import styles from "../dashboard.module.css";

export default function PatientAppointments() {
  const { profile, user } = useAuthUser();
  const onb = profile?.onboarding || {};
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/patient/appointments", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data?.success) throw new Error(data?.message || "fetch failed");
        setRows(data.appointments || []);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "fetch failed");
          setRows([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Fall back to the onboarding-captured slot when the collection has no
  // row yet (e.g. legacy patients who paid before bookings were wired up).
  const fallback = useMemo(() => buildFallback(onb), [onb]);
  const list = rows && rows.length > 0 ? rows : fallback ? [fallback] : [];

  const nowMs = Date.now();
  const upcoming = list.filter((a) => {
    const ms = parseDateTime(a.date, a.time);
    return a.status !== "cancelled" && a.status !== "completed" && ms && ms >= nowMs;
  });
  const past = list.filter((a) => {
    const ms = parseDateTime(a.date, a.time);
    return a.status === "completed" || a.status === "cancelled" || (ms && ms < nowMs);
  });

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Patient · Appointments</div>
          <h1 className={styles.pageTitle}>Appointments</h1>
          <p className={styles.pageSubtitle}>
            Your scheduled and past consultations with our care team.
          </p>
        </div>
      </header>

      <section className={styles.card}>
        <div className={styles.cardEyebrow}>Upcoming</div>

        {rows === null ? (
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            Loading…
          </p>
        ) : upcoming.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📅</div>
            <div className={styles.emptyTitle}>No appointment scheduled</div>
            <div className={styles.emptyBody}>
              {error
                ? "We couldn't load your appointments — try again in a moment."
                : "Finish onboarding to pick a time with one of our doctors."}
            </div>
            <Link
              href="/weightloss-onboard"
              className={styles.ctaPrimary}
              style={{ marginTop: 16 }}
            >
              Continue onboarding →
            </Link>
          </div>
        ) : (
          upcoming.map((a, i) => (
            <UpcomingCard key={a.id || i} appt={a} first={i === 0} />
          ))
        )}
      </section>

      <section className={styles.card} style={{ marginTop: 16 }}>
        <div className={styles.cardEyebrow}>Past</div>
        {past.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>No past appointments</div>
            <div className={styles.emptyBody}>
              Your consultation history will appear here once you&apos;ve had
              your first visit.
            </div>
          </div>
        ) : (
          past.map((a, i) => (
            <div key={a.id || i} className={styles.row}>
              <span className={styles.rowLabel}>
                {formatDateTime(parseDateTime(a.date, a.time))}
              </span>
              <span className={styles.rowValue}>
                <strong>Dr. {a.doctorName || onb.doctor || "—"}</strong>
                <br />
                <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
                  {a.type || "Consultation"} ·{" "}
                  {a.status === "cancelled" ? "Cancelled" : "Completed"}
                </span>
              </span>
            </div>
          ))
        )}
      </section>
    </>
  );
}

function UpcomingCard({ appt, first }) {
  const ms = parseDateTime(appt.date, appt.time);
  return (
    <div style={first ? {} : { marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--color-border)" }}>
      <h2 className={styles.cardTitle} style={{ marginBottom: 10 }}>
        {formatDate(ms) || "Time TBD"}
        {ms ? ` · ${formatTime(ms)}` : ""}
      </h2>
      <div className={styles.row}>
        <span className={styles.rowLabel}>Doctor</span>
        <span className={styles.rowValue}>
          {appt.doctorName ? `Dr. ${appt.doctorName}` : "TBD"}
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.rowLabel}>Type</span>
        <span className={styles.rowValue}>
          {appt.type || "Initial consultation"}
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.rowLabel}>Format</span>
        <span className={styles.rowValue}>Video consultation</span>
      </div>
      <div className={styles.row}>
        <span className={styles.rowLabel}>Status</span>
        <span className={styles.rowValue}>
          <span className={`${styles.pill} ${styles.pillOk}`}>Confirmed</span>
        </span>
      </div>
    </div>
  );
}

function buildFallback(onb) {
  if (!onb) return null;
  const date = onb.slotDate || "";
  const time = onb.slotTime || "";
  if (!date && !time && !onb.slot && !onb.doctor) return null;
  // Older patients only have `slot` ("date|time"). Split it.
  let d = date;
  let t = time;
  if (!d && !t && typeof onb.slot === "string" && onb.slot.includes("|")) {
    [d, t] = onb.slot.split("|");
  }
  return {
    id: "legacy",
    doctorName: onb.doctor || "",
    type: "Initial consultation",
    date: d || "",
    time: t || "",
    status: "scheduled",
  };
}

function parseDateTime(date, time) {
  if (!date || !time) return null;
  // Accept either "YYYY-MM-DD" + "HH:mm" (new) or human strings (legacy).
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time)) {
    const [y, mo, d] = date.split("-").map(Number);
    const [h, m] = time.split(":").map(Number);
    return new Date(y, mo - 1, d, h, m, 0, 0).getTime();
  }
  return null;
}

function formatDate(ms) {
  if (!ms) return "";
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(ms) {
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTime(ms) {
  if (!ms) return "—";
  return `${formatDate(ms)} · ${formatTime(ms)}`;
}
