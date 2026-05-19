"use client";

import { useEffect, useState } from "react";
import { useOnboard } from "./OnboardContext";

export default function S23Booking() {
  const { form, updateField, submit } = useOnboard();
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!form.doctorUid) {
      // No doctor selected yet — nothing to load.
      setSlots([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setSlots(null);
        const res = await fetch(`/api/doctors/${form.doctorUid}/slots`);
        const data = await res.json();
        if (cancelled) return;
        if (!data?.success) throw new Error(data?.message || "fetch failed");
        setSlots(Array.isArray(data.slots) ? data.slots : []);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "Couldn't load times.");
        setSlots([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.doctorUid]);

  // Group slots by date label.
  const byDay = new Map();
  const dayOrder = [];
  for (const s of slots || []) {
    const dayKey = s.date;
    if (!byDay.has(dayKey)) {
      byDay.set(dayKey, { label: formatDayHeader(s.date), entries: [] });
      dayOrder.push(dayKey);
    }
    byDay.get(dayKey).entries.push(s);
  }

  return (
    <div className="sc">
      <div className="q">When would you like to meet your physician?</div>
      <div className="qs">
        Appointments are 30 minutes via secure video call. Pick the slot that
        works best for you.
      </div>

      {slots === null && (
        <div className="qs" style={{ marginTop: 14 }}>
          Loading your physician&apos;s open times…
        </div>
      )}

      {slots && slots.length === 0 && !error && (
        <div className="qs" style={{ marginTop: 14 }}>
          No open slots in the next three weeks. We&apos;ll get back to you
          shortly.
        </div>
      )}

      {error && (
        <div className="qs" style={{ marginTop: 14, color: "#b45309" }}>
          {error}
        </div>
      )}

      <div className="cal2">
        {dayOrder.map((dayKey) => {
          const day = byDay.get(dayKey);
          return (
            <div key={dayKey} className="cal2-day">
              <div className="cal2-day-head">
                <span className="cal2-day-name">{day.label}</span>
                <span className="cal2-day-count">
                  {day.entries.length} slot{day.entries.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="cal2-times">
                {day.entries.map((s) => {
                  const slotId = `${s.date}|${s.time}`;
                  const isSelected = form.slot === slotId;
                  return (
                    <button
                      key={slotId}
                      type="button"
                      className={`cal2-time ${isSelected ? "sel" : ""}`}
                      onClick={() => {
                        updateField("slot", slotId);
                        updateField("slotDate", s.date);
                        updateField("slotTime", s.time);
                      }}
                    >
                      {formatTimeLabel(s.time)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {form.slot && (
        <div className="cal2-confirm">
          <span className="cal2-confirm-icon">✓</span>
          <span>
            You picked{" "}
            <strong>
              {formatDayHeader(form.slotDate)} · {formatTimeLabel(form.slotTime)}
            </strong>
          </span>
        </div>
      )}

      <button
        type="button"
        className="cta"
        disabled={!form.slot}
        onClick={submit}
      >
        Confirm appointment
      </button>
    </div>
  );
}

function formatDayHeader(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTimeLabel(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
