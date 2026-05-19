// app/dashboard/doctor/availability/page.jsx
//
// Doctor's weekly availability editor. Each day can have multiple
// start/end windows; the doctor sets the slot duration (10–120 min) and
// can block specific calendar dates. Saves to /api/doctor/availability.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { auth } from "@/lib/firebase/auth";
import styles from "../../patient/dashboard.module.css";
import local from "./availability.module.css";

const DAYS = [
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
  { key: "sunday", label: "Sunday", short: "Sun" },
];

const SLOT_OPTIONS = [15, 20, 30, 45, 60, 90];

export default function DoctorAvailabilityPage() {
  const { user } = useAuthUser();
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState("");
  const [newBlockedDate, setNewBlockedDate] = useState("");

  // Load current availability
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/doctor/availability", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data?.success) throw new Error(data?.message || "fetch failed");
        setAvailability(data.availability);
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

  const totalSlots = useMemo(() => {
    if (!availability) return 0;
    const dur = availability.slotDurationMinutes || 30;
    let n = 0;
    for (const day of DAYS) {
      const ranges = availability.weeklySchedule?.[day.key] || [];
      for (const r of ranges) {
        const s = toMinutes(r.start);
        const e = toMinutes(r.end);
        if (e > s) n += Math.floor((e - s) / dur);
      }
    }
    return n;
  }, [availability]);

  if (loading) {
    return (
      <>
        <Header />
        <section className={styles.card}>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading your schedule…</p>
        </section>
      </>
    );
  }

  if (!availability) {
    return (
      <>
        <Header />
        <section className={styles.card}>
          <p style={{ color: "#b45309", margin: 0 }}>
            Couldn&apos;t load your availability{error ? `: ${error}` : ""}.
          </p>
        </section>
      </>
    );
  }

  const updateWeek = (day, ranges) =>
    setAvailability((p) => ({
      ...p,
      weeklySchedule: { ...p.weeklySchedule, [day]: ranges },
    }));

  const addRange = (day) => {
    const ranges = availability.weeklySchedule?.[day] || [];
    updateWeek(day, [...ranges, { start: "09:00", end: "12:00" }]);
  };

  const removeRange = (day, idx) => {
    const ranges = (availability.weeklySchedule?.[day] || []).filter((_, i) => i !== idx);
    updateWeek(day, ranges);
  };

  const updateRange = (day, idx, field, value) => {
    const ranges = [...(availability.weeklySchedule?.[day] || [])];
    ranges[idx] = { ...ranges[idx], [field]: value };
    updateWeek(day, ranges);
  };

  const copyMondayToWeekdays = () => {
    const monday = availability.weeklySchedule?.monday || [];
    setAvailability((p) => ({
      ...p,
      weeklySchedule: {
        ...p.weeklySchedule,
        tuesday: cloneRanges(monday),
        wednesday: cloneRanges(monday),
        thursday: cloneRanges(monday),
        friday: cloneRanges(monday),
      },
    }));
  };

  const clearAll = () => {
    setAvailability((p) => ({
      ...p,
      weeklySchedule: DAYS.reduce((acc, d) => {
        acc[d.key] = [];
        return acc;
      }, {}),
    }));
  };

  const addBlockedDate = () => {
    if (!newBlockedDate || !/^\d{4}-\d{2}-\d{2}$/.test(newBlockedDate)) return;
    setAvailability((p) => ({
      ...p,
      blockedDates: Array.from(new Set([...(p.blockedDates || []), newBlockedDate])).sort(),
    }));
    setNewBlockedDate("");
  };

  const removeBlockedDate = (d) =>
    setAvailability((p) => ({
      ...p,
      blockedDates: (p.blockedDates || []).filter((x) => x !== d),
    }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/doctor/availability", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(availability),
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message || "save failed");
      setAvailability(data.availability);
      setSavedAt(Date.now());
    } catch (e) {
      setError(e?.message || "save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />

      {/* Top summary tile */}
      <div className={styles.statRow}>
        <SummaryTile label="Open slots / week" value={totalSlots} tone="green" />
        <SummaryTile
          label="Slot duration"
          value={`${availability.slotDurationMinutes} min`}
          tone="amber"
        />
        <SummaryTile
          label="Blocked dates"
          value={availability.blockedDates?.length || 0}
          tone="coral"
        />
        <SummaryTile label="Timezone" value={availability.timezone} tone="slate" small />
      </div>

      {/* Weekly schedule */}
      <section className={styles.card}>
        <div className={local.cardHead}>
          <div>
            <div className={styles.cardEyebrow}>Weekly schedule</div>
            <h2 className={styles.cardTitle}>When are you available?</h2>
            <p className={local.cardDesc}>
              Add one or more windows per day. Slot duration determines how
              consultations are split.
            </p>
          </div>
          <div className={local.quickActions}>
            <button type="button" className={local.btnGhost} onClick={copyMondayToWeekdays}>
              Copy Mon → Tue-Fri
            </button>
            <button type="button" className={local.btnGhost} onClick={clearAll}>
              Clear all
            </button>
          </div>
        </div>

        <div className={local.slotDurationRow}>
          <span className={local.fieldLabel}>Slot duration</span>
          <div className={local.pillGroup}>
            {SLOT_OPTIONS.map((mins) => (
              <button
                key={mins}
                type="button"
                className={`${local.pill} ${availability.slotDurationMinutes === mins ? local.pillActive : ""}`}
                onClick={() =>
                  setAvailability((p) => ({ ...p, slotDurationMinutes: mins }))
                }
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        <div className={local.week}>
          {DAYS.map((day) => {
            const ranges = availability.weeklySchedule?.[day.key] || [];
            return (
              <div key={day.key} className={local.day}>
                <div className={local.dayHead}>
                  <span className={local.dayLabel}>{day.label}</span>
                  <span className={local.dayCount}>
                    {ranges.length === 0
                      ? "Off"
                      : `${ranges.length} window${ranges.length === 1 ? "" : "s"}`}
                  </span>
                </div>
                <div className={local.ranges}>
                  {ranges.map((r, i) => {
                    const invalid = !r.start || !r.end || r.start >= r.end;
                    return (
                      <div key={i} className={local.range}>
                        <input
                          type="time"
                          className={`${local.timeInput} ${invalid ? local.timeInputErr : ""}`}
                          value={r.start}
                          onChange={(e) => updateRange(day.key, i, "start", e.target.value)}
                        />
                        <span className={local.dash}>→</span>
                        <input
                          type="time"
                          className={`${local.timeInput} ${invalid ? local.timeInputErr : ""}`}
                          value={r.end}
                          onChange={(e) => updateRange(day.key, i, "end", e.target.value)}
                        />
                        <button
                          type="button"
                          className={local.removeBtn}
                          onClick={() => removeRange(day.key, i)}
                          aria-label={`Remove window ${i + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    className={local.addRangeBtn}
                    onClick={() => addRange(day.key)}
                  >
                    + Add window
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Blocked dates */}
      <section className={styles.card} style={{ marginTop: 16 }}>
        <div className={styles.cardEyebrow}>Time off</div>
        <h2 className={styles.cardTitle}>Block specific dates</h2>
        <p className={local.cardDesc}>
          Vacation, training, off-days — block them here so patients can&apos;t book
          them. Already-booked appointments aren&apos;t affected.
        </p>

        <div className={local.blockRow}>
          <input
            type="date"
            className={local.input}
            value={newBlockedDate}
            onChange={(e) => setNewBlockedDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
          />
          <button
            type="button"
            className={local.btnPrimary}
            onClick={addBlockedDate}
            disabled={!newBlockedDate}
          >
            Block this date
          </button>
        </div>

        {availability.blockedDates?.length > 0 ? (
          <div className={local.blocks}>
            {availability.blockedDates.map((d) => (
              <span key={d} className={local.blockChip}>
                {new Date(d + "T00:00:00").toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                <button
                  type="button"
                  onClick={() => removeBlockedDate(d)}
                  aria-label={`Unblock ${d}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--color-text-soft)", fontSize: 13, margin: "12px 0 0" }}>
            No dates blocked.
          </p>
        )}
      </section>

      {/* Sticky save bar */}
      <div className={local.saveBar}>
        {error && <span className={local.saveError}>⚠ {error}</span>}
        {savedAt && !error && (
          <span className={local.saveOk}>
            Saved · {new Date(savedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </span>
        )}
        <button
          type="button"
          className={local.btnPrimary}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </>
  );
}

function Header() {
  return (
    <header className={styles.pageHeader}>
      <div>
        <div className={styles.kicker}>Doctor · Availability</div>
        <h1 className={styles.pageTitle}>Availability</h1>
        <p className={styles.pageSubtitle}>
          Set the windows patients can book during. These feed the slot picker
          in real time.
        </p>
      </div>
    </header>
  );
}

function SummaryTile({ label, value, tone, small }) {
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
        <div
          className={styles.statValue}
          style={small ? { fontSize: 16, fontWeight: 700 } : undefined}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function toMinutes(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function cloneRanges(ranges) {
  return ranges.map((r) => ({ start: r.start, end: r.end }));
}
