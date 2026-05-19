// app/api/doctor/overview/route.js
//
// Stats for the doctor's landing dashboard. One aggregating endpoint so the
// page doesn't have to fan out N requests on load. Returns:
//
//   - assignedPatientsCount: patients whose onboarding.doctorUid points here
//   - upcomingCount: scheduled appointments in the future
//   - todayCount: scheduled appointments today
//   - pendingNotesCount: completed appointments with no notes yet
//   - upcoming: next 5 appointments (oldest→newest)
//   - recentPayments: up to 5 most-recent paid patients assigned to this
//     doctor, with amount + paidAt
//   - totalRevenueCents: sum of paymentAmount across assigned paid patients

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

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

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(request) {
  const decoded = await requireDoctor(request);
  if (!decoded) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const doctorUid = decoded.uid;
  const tKey = todayKey();
  const nowMs = Date.now();

  // Run reads in parallel.
  const [assignedSnap, apptSnap] = await Promise.all([
    adminDb
      .collection("users")
      .where("role", "==", "patient")
      .where("onboarding.doctorUid", "==", doctorUid)
      .get(),
    adminDb
      .collection("appointments")
      .where("doctorUid", "==", doctorUid)
      .get(),
  ]);

  const assignedPatientsCount = assignedSnap.size;

  // --- Recent payments + revenue from assigned patients ---
  let totalRevenueCents = 0;
  const paidPatients = [];
  for (const doc of assignedSnap.docs) {
    const data = doc.data();
    const onb = data.onboarding || {};
    if (!onb.paid) continue;
    const amt = typeof onb.paymentAmount === "number" ? onb.paymentAmount : 0;
    totalRevenueCents += amt;
    const paidAt =
      typeof onb.paidAt === "number"
        ? onb.paidAt
        : typeof onb.paidAt?.toMillis === "function"
          ? onb.paidAt.toMillis()
          : null;
    paidPatients.push({
      patientUid: doc.id,
      patientName:
        [data.firstName, data.lastName].filter(Boolean).join(" ") ||
        data.email ||
        "Patient",
      amountCents: amt,
      currency: onb.paymentCurrency || "usd",
      paidAtMs: paidAt,
      plan: onb.plan || "",
    });
  }
  paidPatients.sort((a, b) => (b.paidAtMs || 0) - (a.paidAtMs || 0));
  const recentPayments = paidPatients.slice(0, 5);

  // --- Appointment buckets ---
  let upcomingCount = 0;
  let todayCount = 0;
  let pendingNotesCount = 0;
  const upcomingList = [];

  for (const doc of apptSnap.docs) {
    const a = doc.data();
    const id = doc.id;
    const dateTimeMs = parseDateTime(a.date, a.time);
    if (a.status === "scheduled") {
      if (dateTimeMs && dateTimeMs > nowMs) {
        upcomingCount++;
        upcomingList.push({
          id,
          date: a.date,
          time: a.time,
          patientName: a.patientName || "",
          type: a.type || "",
          dateTimeMs,
        });
      }
      if (a.date === tKey) todayCount++;
    } else if (a.status === "completed" && !(a.notes || "").trim()) {
      pendingNotesCount++;
    }
  }

  upcomingList.sort((a, b) => (a.dateTimeMs || 0) - (b.dateTimeMs || 0));
  const upcoming = upcomingList.slice(0, 5);

  return NextResponse.json({
    success: true,
    assignedPatientsCount,
    upcomingCount,
    todayCount,
    pendingNotesCount,
    upcoming,
    recentPayments,
    totalRevenueCents,
  });
}

function parseDateTime(date, time) {
  if (!date || !time) return null;
  const [y, mo, d] = date.split("-").map(Number);
  const [h, m] = time.split(":").map(Number);
  if ([y, mo, d, h, m].some((n) => !Number.isFinite(n))) return null;
  return new Date(y, mo - 1, d, h, m, 0, 0).getTime();
}
