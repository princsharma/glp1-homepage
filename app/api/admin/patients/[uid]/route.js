// app/api/admin/patients/[uid]/route.js
//
// PATCH — edit a patient (name, phone, status).
// DELETE — hard-delete the user doc.

import {
  adminDeleteUser,
  adminUpdatePatient,
} from "@/services/firebase/users";
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
      await adminUpdatePatient(uid, body);
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
    await adminDeleteUser(uid);
    return ok();
  },
);
