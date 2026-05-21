// app/api/admin/doctors/route.js
//
// GET — returns every doctor (any status), with priority field, for the
// admin doctors table.

import { listAllDoctorsForAdmin } from "@/services/firebase/doctors";
import { ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth({ role: "admin" }, async () => {
  const doctors = await listAllDoctorsForAdmin();
  return ok({ doctors });
});
