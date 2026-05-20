// app/api/doctors/list/route.js
//
// Public list of active doctors for the patient-facing booking flow.
// No auth required — these profiles are intentionally public-facing
// (name, bio, licensed states) so prospective patients can choose.

import { listActiveDoctors } from "@/services/firebase/doctors";
import { ok, withErrorHandling } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const doctors = await listActiveDoctors();
  return ok({ doctors });
});
