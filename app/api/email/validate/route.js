// app/api/email/validate/route.js
//
// POST /api/email/validate
// body: { email: string }
// response: { valid, reason, message }
//
// Called from the onboarding form's S20 (email capture) BEFORE we attempt
// Firebase sign-up. Catches typos and disposable addresses upfront so the
// user gets immediate feedback without needing to check their inbox.
//
// Cheap per-IP rate limit to keep this from being abused as a free email-
// verification API by scrapers.

import { NextResponse } from "next/server";
import { validateEmailAddress } from "@/services/email/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_HITS = 20; // ~3 sec average per attempt is plenty for a real user
const buckets = new Map();

function rateLimit(ip) {
  if (!ip) return true;
  const now = Date.now();
  const b = buckets.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > b.resetAt) {
    b.count = 0;
    b.resetAt = now + RATE_WINDOW_MS;
  }
  b.count += 1;
  buckets.set(ip, b);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
  }
  return b.count <= RATE_MAX_HITS;
}

function getClientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "";
}

export async function POST(request) {
  try {
    if (!rateLimit(getClientIp(request))) {
      return NextResponse.json(
        { valid: false, reason: "rate_limited", message: "Too many attempts." },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const result = await validateEmailAddress(body.email);
    return NextResponse.json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[email/validate] error:", err);
    return NextResponse.json(
      {
        valid: false,
        reason: "internal_error",
        message: "Could not validate. Please try again.",
      },
      { status: 500 },
    );
  }
}
