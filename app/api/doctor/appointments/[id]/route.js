// app/api/doctor/appointments/[id]/route.js
//
// PATCH a single appointment — the doctor can update notes, status, or
// appointment type. We verify both the token AND that the appointment
// actually belongs to the signed-in doctor before allowing the write.

import {
  getAppointment,
  updateAppointment,
} from "@/services/firebase/appointments";
import { fail, ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withAuth(
  { role: "doctor" },
  async (request, { params }, { user }) => {
    const { id } = params || {};
    if (!id) return fail("Missing id", 400);

    const existing = await getAppointment(id);
    if (!existing) return fail("Not found", 404);
    if (existing.doctorUid !== user.uid) return fail("Forbidden", 403);

    const body = await request.json().catch(() => ({}));
    await updateAppointment(id, body);
    const updated = await getAppointment(id);
    return ok({ appointment: updated });
  },
);
