// app/api/doctors/list/route.js
//
// Public list of active doctors for the patient-facing booking flow.
// No auth required — these profiles are intentionally public-facing
// (name, bio, licensed states) so prospective patients can choose.

import { NextResponse } from "next/server";
import { listActiveDoctors } from "@/services/firebase/doctors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const doctors = await listActiveDoctors();
    return NextResponse.json({ success: true, doctors });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
