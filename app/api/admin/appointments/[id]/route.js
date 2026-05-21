// app/api/admin/appointments/[id]/route.js
//
// PATCH — admin edit (currently just status changes — e.g. cancel).
// DELETE — hard-delete the appointment.

import {
  adminDeleteAppointment,
  updateAppointment,
} from "@/services/firebase/appointments";
import { fail, ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withAuth(
  { role: "admin" },
  async (request, { params }) => {
    const id = params?.id;
    if (!id) return fail("Missing id", 400);
    const body = await request.json().catch(() => ({}));
    try {
      await updateAppointment(id, body);
    } catch (err) {
      return fail(err?.message || "Update failed", 400);
    }
    return ok();
  },
);

export const DELETE = withAuth(
  { role: "admin" },
  async (_request, { params }) => {
    const id = params?.id;
    if (!id) return fail("Missing id", 400);
    await adminDeleteAppointment(id);
    return ok();
  },
);
