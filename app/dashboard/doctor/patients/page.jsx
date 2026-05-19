// app/dashboard/doctor/patients/page.jsx
//
// Doctor's patient roster. List with quick search and summary chips per
// patient (plan, paid status, BMI, age). Clicking a row opens the detail
// page at /dashboard/doctor/patients/[uid].

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { auth } from "@/lib/firebase/auth";
import styles from "../../patient/dashboard.module.css";
import local from "./patients.module.css";

const PLAN_LABELS = {
  "1m": "1-month",
  "3m": "3-month",
  "6m": "6-month",
};

export default function DoctorPatientsPage() {
  const { user } = useAuthUser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | paid | unpaid | upcoming

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/doctor/patients", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data?.success) throw new Error(data?.message || "fetch failed");
        setRows(data.patients || []);
      } catch (e) {
        if (!cancelled) setError(e?.message || "fetch failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      if (filter === "paid" && !p.paid) return false;
      if (filter === "unpaid" && p.paid) return false;
      if (filter === "upcoming" && !p.nextAppointment) return false;
      if (!q) return true;
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.phone || "").toLowerCase().includes(q)
      );
    });
  }, [rows, filter, query]);

  const counts = useMemo(() => {
    let paid = 0;
    let upcoming = 0;
    for (const p of rows) {
      if (p.paid) paid++;
      if (p.nextAppointment) upcoming++;
    }
    return { all: rows.length, paid, unpaid: rows.length - paid, upcoming };
  }, [rows]);

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Doctor · Patients</div>
          <h1 className={styles.pageTitle}>Patients</h1>
          <p className={styles.pageSubtitle}>
            Everyone who picked you as their clinician. Click a row to see
            their full intake.
          </p>
        </div>
      </header>

      <div className={local.toolbar}>
        <div className={local.tabs} role="tablist">
          <Tab label="All" count={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
          <Tab label="Paid" count={counts.paid} active={filter === "paid"} onClick={() => setFilter("paid")} />
          <Tab label="Unpaid" count={counts.unpaid} active={filter === "unpaid"} onClick={() => setFilter("unpaid")} />
          <Tab label="Has upcoming" count={counts.upcoming} active={filter === "upcoming"} onClick={() => setFilter("upcoming")} />
        </div>
        <input
          type="search"
          className={local.search}
          placeholder="Search by name, email, or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <section className={styles.card}>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading patients…</p>
        </section>
      ) : error ? (
        <section className={styles.card}>
          <p style={{ color: "#b45309", margin: 0 }}>Couldn&apos;t load: {error}</p>
        </section>
      ) : filtered.length === 0 ? (
        <section className={styles.card}>
          <div className={styles.empty}>
            <div className={styles.emptyIllus}><UsersIcon /></div>
            <div className={styles.emptyTitle}>
              {rows.length === 0 ? "No patients yet" : "No matches"}
            </div>
            <div className={styles.emptyBody}>
              {rows.length === 0
                ? "Once a patient picks you during onboarding they'll appear here."
                : "Try clearing your search or switching tabs."}
            </div>
          </div>
        </section>
      ) : (
        <div className={local.list}>
          <div className={`${local.row} ${local.head}`}>
            <span>Patient</span>
            <span>Age / Sex</span>
            <span>BMI</span>
            <span>Plan</span>
            <span>Next visit</span>
            <span style={{ textAlign: "right" }}>Status</span>
          </div>
          {filtered.map((p) => (
            <Link key={p.uid} href={`/dashboard/doctor/patients/${p.uid}`} className={local.row}>
              <span className={local.patient}>
                <span className={local.initial}>
                  {(p.firstName?.[0] || p.fullName?.[0] || "?").toUpperCase()}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className={local.patientName}>{p.fullName}</span>
                  <span className={local.patientMeta}>{p.email}</span>
                </span>
              </span>
              <span>
                {p.age != null ? `${p.age}y` : "—"}
                {p.sex ? ` · ${capitalize(p.sex)}` : ""}
              </span>
              <span>{p.bmi != null ? p.bmi.toFixed(1) : "—"}</span>
              <span>{PLAN_LABELS[p.plan] || "—"}</span>
              <span className={local.nextVisit}>
                {p.nextAppointment
                  ? `${formatDate(p.nextAppointment.date)} · ${formatTime(p.nextAppointment.time)}`
                  : "—"}
              </span>
              <span style={{ textAlign: "right" }}>
                {p.paid ? (
                  <span className={`${styles.pill} ${styles.pillOk}`}>Paid</span>
                ) : (
                  <span className={`${styles.pill} ${styles.pillWarn}`}>Unpaid</span>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function Tab({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      className={`${local.tab} ${active ? local.tabActive : ""}`}
      onClick={onClick}
      role="tab"
      aria-selected={active}
    >
      <span>{label}</span>
      <span className={local.tabCount}>{count}</span>
    </button>
  );
}

function formatDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatTime(hhmm) {
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

function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-4 3.5-6 7-6s7 2 7 6" />
      <circle cx="17" cy="8" r="3" />
      <path d="M22 20c0-3-2-5-5-5" />
    </svg>
  );
}
