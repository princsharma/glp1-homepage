// app/api/admin/patients/route.js
//
// GET — returns every patient (role === "patient") for the admin
// patients table.

import { listAllPatientsForAdmin } from "@/services/firebase/users";
import { ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth({ role: "admin" }, async () => {
  const patients = await listAllPatientsForAdmin();
  return ok({ patients });
});
