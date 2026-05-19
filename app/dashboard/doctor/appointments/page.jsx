// app/dashboard/doctor/appointments/page.jsx
//
// Doctor's Appointments view. Filter tabs (Upcoming / Past / All) over a
// list of every appointment, plus an inline panel for editing notes and
// flipping status to completed / cancelled. Optimistic updates on PATCH.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { auth } from "@/lib/firebase/auth";
import styles from "../../patient/dashboard.module.css";
import local from "./appointments.module.css";

const TYPES = ["Initial consultation", "Ozempic", "Wegovy", "Zepbound", "Follow-up"];

export default function DoctorAppointmentsPage() {
  const { user } = useAuthUser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("upcoming");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/doctor/appointments", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data?.success) throw new Error(data?.message || "fetch failed");
        setRows(data.appointments || []);
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

  const nowMs = Date.now();
  const filtered = useMemo(() => {
    return rows.filter((a) => {
      const ms = parseDateTime(a.date, a.time);
      if (filter === "upcoming") {
        return a.status === "scheduled" && ms && ms >= nowMs;
      }
      if (filter === "past") {
        return a.status === "completed" || (ms && ms < nowMs);
      }
      return true;
    });
  }, [rows, filter, nowMs]);

  const counts = useMemo(() => {
    let upcoming = 0;
    let past = 0;
    for (const a of rows) {
      const ms = parseDateTime(a.date, a.time);
      if (a.status === "scheduled" && ms && ms >= nowMs) upcoming++;
      else if (a.status === "completed" || (ms && ms < nowMs)) past++;
    }
    return { upcoming, past, all: rows.length };
  }, [rows, nowMs]);

  const onPatch = async (id, updates) => {
    const prev = rows;
    setRows((r) => r.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/doctor/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message || "save failed");
      setRows((r) => r.map((a) => (a.id === id ? data.appointment : a)));
    } catch (e) {
      setRows(prev);
      // eslint-disable-next-line no-alert
      alert("Couldn't save changes: " + (e?.message || "unknown error"));
    }
  };

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Doctor · Appointments</div>
          <h1 className={styles.pageTitle}>Appointments</h1>
          <p className={styles.pageSubtitle}>
            Your scheduled consultations, with inline notes and status updates.
          </p>
        </div>
      </header>

      {/* Filter tabs */}
      <div className={local.tabs} role="tablist">
        <FilterTab label="Upcoming" count={counts.upcoming} active={filter === "upcoming"} onClick={() => setFilter("upcoming")} />
        <FilterTab label="Past" count={counts.past} active={filter === "past"} onClick={() => setFilter("past")} />
        <FilterTab label="All" count={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
      </div>

      {loading ? (
        <section className={styles.card}>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading appointments…</p>
        </section>
      ) : error ? (
        <section className={styles.card}>
          <p style={{ color: "#b45309", margin: 0 }}>Couldn&apos;t load: {error}</p>
        </section>
      ) : filtered.length === 0 ? (
        <section className={styles.card}>
          <div className={styles.empty}>
            <div className={styles.emptyIllus}><CalendarIcon /></div>
            <div className={styles.emptyTitle}>
              {filter === "upcoming"
                ? "No upcoming appointments"
                : filter === "past"
                  ? "No past appointments"
                  : "No appointments yet"}
            </div>
            <div className={styles.emptyBody}>
              {filter === "upcoming"
                ? "Make sure your availability is set up so patients can book."
                : "Once a consultation wraps up, it'll show here."}
            </div>
          </div>
        </section>
      ) : (
        <div className={local.list}>
          {filtered.map((a) => (
            <AppointmentRow
              key={a.id}
              appt={a}
              open={openId === a.id}
              onToggle={() => setOpenId(openId === a.id ? null : a.id)}
              onPatch={(updates) => onPatch(a.id, updates)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function FilterTab({ label, count, active, onClick }) {
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

function AppointmentRow({ appt, open, onToggle, onPatch }) {
  const [notes, setNotes] = useState(appt.notes || "");
  const [type, setType] = useState(appt.type || "Initial consultation");

  useEffect(() => {
    setNotes(appt.notes || "");
    setType(appt.type || "Initial consultation");
  }, [appt.id, appt.notes, appt.type]);

  const dtMs = parseDateTime(appt.date, appt.time);
  const isPast = dtMs && dtMs < Date.now();
  const statusTone =
    appt.status === "completed"
      ? local.statusDone
      : appt.status === "cancelled"
        ? local.statusCancelled
        : isPast
          ? local.statusOverdue
          : local.statusScheduled;

  const statusLabel =
    appt.status === "completed"
      ? "Completed"
      : appt.status === "cancelled"
        ? "Cancelled"
        : isPast
          ? "Awaiting wrap-up"
          : "Scheduled";

  const notesDirty = notes !== (appt.notes || "");
  const typeDirty = type !== (appt.type || "Initial consultation");
  const dirty = notesDirty || typeDirty;

  return (
    <article className={local.row}>
      <button type="button" className={local.rowHead} onClick={onToggle} aria-expanded={open}>
        <div className={local.rowWhen}>
          <div className={local.rowDate}>{formatDate(dtMs)}</div>
          <div className={local.rowTime}>{formatTime(dtMs) || "—"}</div>
        </div>
        <div className={local.rowWho}>
          <div className={local.rowPatient}>{appt.patientName || "Patient"}</div>
          <div className={local.rowMeta}>{appt.type || "Consultation"} · {appt.patientEmail || ""}</div>
        </div>
        <div className={local.rowEnd}>
          <span className={`${local.status} ${statusTone}`}>{statusLabel}</span>
          <span className={`${local.chevron} ${open ? local.chevronOpen : ""}`}>▾</span>
        </div>
      </button>

      {open && (
        <div className={local.rowBody}>
          <div className={local.bodyGrid}>
            <label className={local.bodyField}>
              <span className={local.fieldLabel}>Consultation type</span>
              <select
                className={local.input}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <label className={local.bodyField}>
              <span className={local.fieldLabel}>Session notes</span>
              <textarea
                className={`${local.input} ${local.textarea}`}
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Brief summary, dose, follow-up plan…"
              />
            </label>
          </div>

          <div className={local.actions}>
            <button
              type="button"
              className={local.btnGhost}
              disabled={appt.status === "cancelled"}
              onClick={() => onPatch({ status: "cancelled" })}
            >
              Cancel appointment
            </button>
            <div className={local.actionsRight}>
              <button
                type="button"
                className={local.btnPrimary}
                disabled={!dirty}
                onClick={() => onPatch({ notes, type })}
              >
                Save changes
              </button>
              <button
                type="button"
                className={local.btnDark}
                disabled={appt.status === "completed"}
                onClick={() => onPatch({ status: "completed", notes, type })}
              >
                Mark completed
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function parseDateTime(date, time) {
  if (!date || !time) return null;
  const [y, mo, d] = date.split("-").map(Number);
  const [h, m] = time.split(":").map(Number);
  if ([y, mo, d, h, m].some((n) => !Number.isFinite(n))) return null;
  return new Date(y, mo - 1, d, h, m, 0, 0).getTime();
}

function formatDate(ms) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(ms) {
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}
