// services/firebase/availability.js
//
// Read/write helpers for the `availability/{doctorUid}` collection that
// drives the patient-facing slot picker. Schema:
//
//   availability/{doctorUid}
//   ├── doctorUid             string — equals the document id
//   ├── weeklySchedule        map    — day → [{ start: "HH:mm", end: "HH:mm" }]
//   ├── slotDurationMinutes   number — default 30
//   ├── blockedDates          array  — ISO YYYY-MM-DD strings
//   ├── timezone              string — IANA, defaults "America/New_York"
//   └── updatedAt             timestamp
//
// All time strings are 24h HH:mm in the doctor's stated timezone.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

const COLLECTION = "availability";

export const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const DAY_LABELS = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

function emptyWeek() {
  return DAY_KEYS.reduce((acc, k) => {
    acc[k] = [];
    return acc;
  }, {});
}

export function defaultAvailability() {
  // Reasonable default — clinician works Mon-Fri, 9-12 and 14-17, 30 min slots.
  const week = emptyWeek();
  const businessDays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  for (const d of businessDays) {
    week[d] = [
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "17:00" },
    ];
  }
  return {
    weeklySchedule: week,
    slotDurationMinutes: 30,
    blockedDates: [],
    timezone: "America/New_York",
  };
}

export function sanitizeAvailability(input = {}) {
  const week = emptyWeek();
  const inWeek =
    input.weeklySchedule && typeof input.weeklySchedule === "object"
      ? input.weeklySchedule
      : {};
  for (const day of DAY_KEYS) {
    const ranges = Array.isArray(inWeek[day]) ? inWeek[day] : [];
    week[day] = ranges
      .map((r) => ({
        start: typeof r?.start === "string" ? r.start : "",
        end: typeof r?.end === "string" ? r.end : "",
      }))
      .filter((r) => HHMM.test(r.start) && HHMM.test(r.end) && r.start < r.end);
  }

  const sd = Number(input.slotDurationMinutes);
  const slotDurationMinutes =
    Number.isFinite(sd) && sd >= 10 && sd <= 120 ? Math.round(sd) : 30;

  const blockedDates = Array.isArray(input.blockedDates)
    ? Array.from(
        new Set(
          input.blockedDates
            .filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)),
        ),
      ).sort()
    : [];

  const timezone =
    typeof input.timezone === "string" && input.timezone.length <= 64
      ? input.timezone
      : "America/New_York";

  return { weeklySchedule: week, slotDurationMinutes, blockedDates, timezone };
}

export async function getAvailability(doctorUid) {
  const snap = await adminDb.collection(COLLECTION).doc(doctorUid).get();
  if (!snap.exists) return null;
  return { doctorUid, ...snap.data() };
}

export async function getOrDefaultAvailability(doctorUid) {
  const existing = await getAvailability(doctorUid);
  return existing || { doctorUid, ...defaultAvailability() };
}

export async function setAvailability(doctorUid, input) {
  const clean = sanitizeAvailability(input);
  await adminDb.collection(COLLECTION).doc(doctorUid).set(
    { doctorUid, ...clean, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return clean;
}

/* ───── Slot generation ───── */

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Generate every slot a doctor could offer over the next `daysAhead` days,
 * excluding blocked dates and any already-booked slots.
 *
 *   bookedSet: Set of `${date}|${time}` strings for that doctor.
 *
 * Returns an array of `{ date, time, label, isoStart }`. Slots are returned
 * in chronological order. Slots in the past are filtered out.
 */
export function generateSlots(availability, bookedSet = new Set(), daysAhead = 21) {
  if (!availability) return [];
  const { weeklySchedule, slotDurationMinutes, blockedDates } = availability;
  const blocked = new Set(blockedDates || []);
  const out = [];
  const now = new Date();
  const todayKey = dateKey(now);

  for (let offset = 0; offset < daysAhead; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const key = dateKey(d);
    if (blocked.has(key)) continue;
    const dayName = DAY_KEYS[d.getDay()];
    const ranges = weeklySchedule[dayName] || [];

    for (const range of ranges) {
      const startMin = toMinutes(range.start);
      const endMin = toMinutes(range.end);
      for (let m = startMin; m + slotDurationMinutes <= endMin; m += slotDurationMinutes) {
        const time = fromMinutes(m);
        const slotKey = `${key}|${time}`;
        if (bookedSet.has(slotKey)) continue;

        // Skip slots earlier than now on today's date
        if (key === todayKey) {
          const slotDate = new Date(d);
          const [h, mm] = time.split(":").map(Number);
          slotDate.setHours(h, mm, 0, 0);
          if (slotDate.getTime() <= now.getTime()) continue;
        }

        const labelDate = new Date(d);
        labelDate.setHours(0, 0, 0, 0);
        const label = `${labelDate.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })} · ${formatTimeLabel(time)}`;

        out.push({
          date: key,
          time,
          label,
        });
      }
    }
  }
  return out;
}

function formatTimeLabel(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
