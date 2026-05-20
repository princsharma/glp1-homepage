// app/api/stripe/payment-intent/route.js
//
// Creates a Stripe PaymentIntent for the patient-onboarding plan picker.
// No auth required — checkout happens before the Firebase Auth user exists.

import Stripe from "stripe";
import { fail, ok, withErrorHandling } from "@/lib/api";

const PLAN_PRICES = {
  "1m": { months: 1, monthly: 69 },
  "3m": { months: 3, monthly: 219 },
  "6m": { months: 6, monthly: 499 },
};
const CURRENCY = "usd";

export const POST = withErrorHandling(async (req) => {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || secret === "sk_test_REPLACE_ME") {
    return fail("Stripe secret key is not configured.", 500);
  }

  const body = await req.json().catch(() => ({}));
  const planId = typeof body.plan === "string" ? body.plan : "";
  const plan = PLAN_PRICES[planId];
  if (!plan) return fail("Invalid or missing plan.", 400);

  const amountCents = plan.monthly * plan.months * 100;
  const stripe = new Stripe(secret);

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: CURRENCY,
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: {
      flow: "weightloss-onboard",
      plan: planId,
      months: String(plan.months),
      monthly: String(plan.monthly),
      email: typeof body.email === "string" ? body.email : "",
      name: typeof body.name === "string" ? body.name : "",
    },
  });

  return ok({
    clientSecret: intent.client_secret,
    amount: amountCents,
    currency: CURRENCY,
    plan: planId,
    months: plan.months,
    monthly: plan.monthly,
  });
});
