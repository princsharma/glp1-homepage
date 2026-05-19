// app/api/patient/appointments/route.js
//
// GET: every appointment booked by the signed-in patient.

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { listAppointmentsForPatient } from "@/services/firebase/appointments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function verifyAuth(request) {
  const header = request.headers.get("authorization") || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!idToken) return null;
  try {
    return await adminAuth.verifyIdToken(idToken);
  } catch {
    return null;
  }
}

export async function GET(request) {
  const decoded = await verifyAuth(request);
  if (!decoded?.uid) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const appointments = await listAppointmentsForPatient(decoded.uid);
  return NextResponse.json({ success: true, appointments });
}
