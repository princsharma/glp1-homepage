// app/dashboard/patient/appointments/page.jsx
//
// Appointments / doctor meet. Today there is at most one scheduled
// consultation (captured during onboarding as `slot` + `doctor`). When
// rescheduling or follow-up bookings ship, this page becomes the list and
// gets actions like Reschedule / Cancel.

"use client";

import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import styles from "../dashboard.module.css";

export default function PatientAppointments() {
  const { profile } = useAuthUser();
  const onb = profile?.onboarding || {};
  const [slotDate, slotTime] = (onb.slot || "").split("|");
  const hasAppointment = !!(slotDate || onb.doctor);

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

        {hasAppointment ? (
          <>
            <h2 className={styles.cardTitle} style={{ marginBottom: 10 }}>
              {slotDate || "Time TBD"}
              {slotTime ? ` · ${slotTime}` : ""}
            </h2>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Doctor</span>
              <span className={styles.rowValue}>{onb.doctor || "TBD"}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Format</span>
              <span className={styles.rowValue}>Video consultation</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Status</span>
              <span className={styles.rowValue}>
                <span className={`${styles.pill} ${styles.pillOk}`}>
                  Confirmed
                </span>
              </span>
            </div>
            <p
              style={{
                marginTop: 16,
                color: "var(--color-text-muted)",
                fontSize: 13,
                fontStyle: "italic",
              }}
            >
              Rescheduling will be available from here in a future update.
              For now, contact support if you need to change this slot.
            </p>
          </>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📅</div>
            <div className={styles.emptyTitle}>No appointment scheduled</div>
            <div className={styles.emptyBody}>
              Finish onboarding to pick a time with one of our doctors.
            </div>
            <Link
              href="/weightloss-onboard"
              className={styles.ctaPrimary}
              style={{ marginTop: 16 }}
            >
              Continue onboarding →
            </Link>
          </div>
        )}
      </section>

      <section className={styles.card} style={{ marginTop: 16 }}>
        <div className={styles.cardEyebrow}>Past</div>
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>No past appointments</div>
          <div className={styles.emptyBody}>
            Your consultation history will appear here once you&apos;ve had
            your first visit.
          </div>
        </div>
      </section>
    </>
  );
}
