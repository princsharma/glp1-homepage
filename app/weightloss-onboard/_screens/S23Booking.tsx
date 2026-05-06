"use client";

import { generateSlots, type Slot } from "../data";
import { useOnboard } from "./OnboardContext";

export default function S23Booking() {
  const { form, updateField, submit } = useOnboard();

  const slotsList = generateSlots();
  const days: string[] = [];
  const byDay = new Map<string, Slot[]>();
  slotsList.forEach((slot) => {
    if (!byDay.has(slot.d)) {
      byDay.set(slot.d, []);
      days.push(slot.d);
    }
    byDay.get(slot.d)!.push(slot);
  });

  return (
    <div className="sc">
      <div className="q">When would you like to meet your physician?</div>
      <div className="qs">
        Appointments are 15–20 minutes via secure video call. Pick the slot
        that works best for you.
      </div>

      <div className="cal2">
        {days.map((day) => {
          const slots = byDay.get(day)!;
          return (
            <div key={day} className="cal2-day">
              <div className="cal2-day-head">
                <span className="cal2-day-name">{day}</span>
                <span className="cal2-day-count">
                  {slots.length} slot{slots.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="cal2-times">
                {slots.map((slot) => {
                  const slotId = `${slot.d}|${slot.t}`;
                  const isSelected = form.slot === slotId;
                  return (
                    <button
                      key={slotId}
                      type="button"
                      className={`cal2-time ${isSelected ? "sel" : ""}`}
                      onClick={() => updateField("slot", slotId)}
                    >
                      {slot.t}
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
            You picked <strong>{form.slot.replace("|", " · ")}</strong>
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
