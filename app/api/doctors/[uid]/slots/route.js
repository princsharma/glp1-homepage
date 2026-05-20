// app/api/doctors/[uid]/slots/route.js
//
// Public endpoint returning every available slot for a given doctor over
// the next ~3 weeks. Used by the patient-facing booking screen.
//
// "Available" means: inside a weeklySchedule window, not on a blocked date,
// not in the past, and not already booked by another patient.

import {
  getOrDefaultAvailability,
  generateSlots,
} from "@/services/firebase/availability";
import { bookedSlotKeysForDoctor } from "@/services/firebase/appointments";
import { getDoctor } from "@/services/firebase/doctors";
import { fail, ok, withErrorHandling } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (_request, { params }) => {
  const { uid } = params || {};
  if (!uid) return fail("Missing uid", 400);

  const doctor = await getDoctor(uid);
  if (!doctor) return fail("Doctor not found", 404);

  const [availability, booked] = await Promise.all([
    getOrDefaultAvailability(uid),
    bookedSlotKeysForDoctor(uid),
  ]);

  const slots = generateSlots(availability, booked, 21);
  return ok({
    doctor,
    slotDurationMinutes: availability.slotDurationMinutes,
    timezone: availability.timezone,
    slots,
  });
});
