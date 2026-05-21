// app/api/admin/doctors/[uid]/route.js
//
// PATCH — update an individual doctor's status / priority / editable
//         profile fields. Used for approve/reject and priority bumps.
// DELETE — hard-delete the doctor's user doc.

import {
  adminDeleteDoctor,
  adminUpdateDoctor,
} from "@/services/firebase/doctors";
import { fail, ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withAuth(
  { role: "admin" },
  async (request, { params }) => {
    const uid = params?.uid;
    if (!uid) return fail("Missing uid", 400);
    const body = await request.json().catch(() => ({}));
    try {
      await adminUpdateDoctor(uid, body);
    } catch (err) {
      return fail(err?.message || "Update failed", 400);
    }
    return ok();
  },
);

export const DELETE = withAuth(
  { role: "admin" },
  async (_request, { params }) => {
    const uid = params?.uid;
    if (!uid) return fail("Missing uid", 400);
    await adminDeleteDoctor(uid);
    return ok();
  },
);
