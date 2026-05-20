// app/api/doctor/availability/route.js
//
// Doctor's own availability — GET fetches their current schedule (or a
// sensible default if they haven't saved one yet), PUT overwrites it.
// Auth: Firebase ID token of a user whose role === "doctor".

import {
  getOrDefaultAvailability,
  setAvailability,
} from "@/services/firebase/availability";
import { ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth({ role: "doctor" }, async (_request, _ctx, { user }) => {
  const availability = await getOrDefaultAvailability(user.uid);
  return ok({ availability });
});

export const PUT = withAuth({ role: "doctor" }, async (request, _ctx, { user }) => {
  const body = await request.json().catch(() => ({}));
  const saved = await setAvailability(user.uid, body);
  return ok({ availability: { doctorUid: user.uid, ...saved } });
});
