// app/api/doctor/availability/route.js
//
// Doctor's own availability — GET fetches their current schedule (or a
// sensible default if they haven't saved one yet), PUT overwrites it.
// Auth: Firebase ID token of a user whose role === "doctor".

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import {
  getOrDefaultAvailability,
  setAvailability,
} from "@/services/firebase/availability";

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

export async function GET(request) {
  const decoded = await requireDoctor(request);
  if (!decoded) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const availability = await getOrDefaultAvailability(decoded.uid);
  return NextResponse.json({ success: true, availability });
}

export async function PUT(request) {
  const decoded = await requireDoctor(request);
  if (!decoded) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const saved = await setAvailability(decoded.uid, body);
  return NextResponse.json({ success: true, availability: { doctorUid: decoded.uid, ...saved } });
}
