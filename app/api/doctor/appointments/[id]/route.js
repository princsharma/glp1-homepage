// app/api/doctor/appointments/[id]/route.js
//
// PATCH a single appointment — the doctor can update notes, status, or
// appointment type. We verify both the token AND that the appointment
// actually belongs to the signed-in doctor before allowing the write.

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import {
  getAppointment,
  updateAppointment,
} from "@/services/firebase/appointments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireDoctor(request) {
  const header = request.headers.get("authorization") || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!idToken) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
    if (!userSnap.exists || userSnap.data()?.role !== "doctor") return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function PATCH(request, { params }) {
  const decoded = await requireDoctor(request);
  if (!decoded) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = params || {};
  if (!id) {
    return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 });
  }

  const existing = await getAppointment(id);
  if (!existing) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }
  if (existing.doctorUid !== decoded.uid) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  await updateAppointment(id, body);
  const updated = await getAppointment(id);
  return NextResponse.json({ success: true, appointment: updated });
}
