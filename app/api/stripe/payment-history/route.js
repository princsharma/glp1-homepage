// app/api/stripe/payment-history/route.js
//
// Returns every succeeded Stripe PaymentIntent that carries the
// signed-in user's email in metadata, plus a summed total. Used by the
// Plan & billing dashboard tile so "Total spending" reflects ALL payments,
// not just the most recent one stored on the user's Firestore doc.
//
// Auth: Firebase ID token in the Authorization header. We trust the token's
// `email` claim (server-verified) rather than anything in the request body —
// otherwise a caller could ask for someone else's total.

import Stripe from "stripe";
import { fail, ok, withAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (_request, _ctx, { decoded }) => {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || secret === "sk_test_REPLACE_ME") {
    return fail("Stripe secret key is not configured.", 500);
  }

  const email = (decoded.email || "").trim().toLowerCase();
  if (!email) {
    return ok({ totalCents: 0, currency: "usd", count: 0, payments: [] });
  }

  // Stripe search query syntax escapes a single quote as two single quotes.
  // We also strip anything that isn't a normal email character to keep the
  // query well-formed.
  const safe = email.replace(/[^a-z0-9@._\-+]/g, "");
  const escaped = safe.replace(/'/g, "''");
  const stripe = new Stripe(secret);

  // paymentIntents.search returns at most 100 per page; for our flow a
  // single page is plenty. If you ever support >100 payments per patient,
  // paginate with `next_page`.
  const search = await stripe.paymentIntents.search({
    query: `status:'succeeded' AND metadata['email']:'${escaped}'`,
    limit: 100,
    expand: ["data.payment_method"],
  });

  let totalCents = 0;
  let currency = "usd";
  const payments = [];

  for (const intent of search.data) {
    totalCents += intent.amount || 0;
    currency = intent.currency || currency;
    const pm = intent.payment_method;
    const card = pm && typeof pm === "object" ? pm.card : null;
    payments.push({
      id: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      paidAt: (intent.created || 0) * 1000,
      plan: intent.metadata?.plan || "",
      brand: card?.brand || "",
      last4: card?.last4 || "",
    });
  }

  payments.sort((a, b) => b.paidAt - a.paidAt);

  return ok({ totalCents, currency, count: payments.length, payments });
});
