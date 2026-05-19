// app/api/doctors/[uid]/slots/route.js
//
// Public endpoint returning every available slot for a given doctor over
// the next ~3 weeks. Used by the patient-facing booking screen.
//
// "Available" means: inside a weeklySchedule window, not on a blocked date,
// not in the past, and not already booked by another patient.

import { NextResponse } from "next/server";
import {
  getOrDefaultAvailability,
  generateSlots,
} from "@/services/firebase/availability";
import { bookedSlotKeysForDoctor } from "@/services/firebase/appointments";
import { getDoctor } from "@/services/firebase/doctors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { uid } = params || {};
  if (!uid) {
    return NextResponse.json({ success: false, message: "Missing uid" }, { status: 400 });
  }

  const doctor = await getDoctor(uid);
  if (!doctor) {
    return NextResponse.json({ success: false, message: "Doctor not found" }, { status: 404 });
  }

  const [availability, booked] = await Promise.all([
    getOrDefaultAvailability(uid),
    bookedSlotKeysForDoctor(uid),
  ]);

  const slots = generateSlots(availability, booked, 21);
  return NextResponse.json({
    success: true,
    doctor,
    slotDurationMinutes: availability.slotDurationMinutes,
    timezone: availability.timezone,
    slots,
  });
}
