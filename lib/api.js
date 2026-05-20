// lib/api.js
//
// Tiny utility layer every API route in app/api/* uses:
//
//   import { withAuth, ok, fail } from "@/lib/api";
//
//   export const GET = withAuth({ role: "doctor" }, async (req, ctx, { user, decoded }) => {
//     const data = await fetchOverviewFor(user.uid);
//     return ok({ data });
//   });
//
// Why a wrapper:
//   - Every protected route was repeating the same ~10-line Bearer-token
//     + verifyIdToken + (optional) role check. Centralizing it kills the
//     copy-paste, normalizes the 401 response, and gives one place to add
//     cross-cutting concerns later (rate limiting, request logging,
//     verification-status gates, etc.).
//   - The handler signature mirrors Next.js's: (request, context, auth).
//     `auth` is added on the right so existing context (e.g. params) is
//     untouched.
//
// Response shape stays { success: true/false, message?, ...data } so we
// don't have to change a single client.

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

/* ─── Response helpers ───────────────────────────────────────────────── */

export function ok(data = {}) {
  return NextResponse.json({ success: true, ...data });
}

export function fail(message, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

/* ─── Auth ───────────────────────────────────────────────────────────── */

// Verify the Authorization: Bearer <idToken> header. When `role` is given,
// also loads the user's Firestore doc and confirms the role matches.
//
// Returns { decoded, user } on success, or null on any failure (missing
// token, invalid token, missing user doc, wrong role). Routes that need
// finer-grained error responses can call this directly instead of using
// withAuth.
export async function authenticate(request, { role } = {}) {
  const header = request.headers.get("authorization") || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!idToken) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (!role) {
      return {
        decoded,
        user: { uid: decoded.uid, email: decoded.email || "" },
      };
    }
    const snap = await adminDb.collection("users").doc(decoded.uid).get();
    if (!snap.exists) return null;
    const data = snap.data();
    if (data?.role !== role) return null;
    return { decoded, user: { uid: decoded.uid, ...data } };
  } catch {
    return null;
  }
}

/* ─── Wrappers ───────────────────────────────────────────────────────── */

// Wrap a route handler with consistent error handling. Public endpoints
// (e.g. /api/doctors/list, /api/stripe/payment-intent) use this directly.
export function withErrorHandling(handler) {
  return async (request, ctx) => {
    try {
      return await handler(request, ctx);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[api] handler error:", err);
      return fail(err?.message || "Unknown error", 500);
    }
  };
}

// Wrap a route handler so it only runs for authenticated requests, with
// an optional role check.
//
// Two call styles:
//   withAuth(handler)                          — any signed-in user
//   withAuth({ role: "doctor" }, handler)      — must be a doctor
//
// On auth failure, returns 401 { success: false, message: "Unauthorized" }.
// On handler exception, returns 500 with the error message — matching the
// behavior the routes had with their inline try/catch blocks.
export function withAuth(arg1, arg2) {
  const [options, handler] =
    typeof arg1 === "function" ? [{}, arg1] : [arg1, arg2];

  return withErrorHandling(async (request, ctx) => {
    const auth = await authenticate(request, { role: options.role });
    if (!auth) return fail("Unauthorized", 401);
    return handler(request, ctx, auth);
  });
}
