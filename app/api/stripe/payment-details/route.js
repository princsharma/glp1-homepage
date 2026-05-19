// app/api/stripe/payment-details/route.js
//
// Called by the onboarding payment screen right after Stripe confirms a card
// charge. We can't read card details on the client (Stripe Elements hide them
// by design), so we look up the PaymentIntent server-side using the same
// secret key that created it and return a sanitized card snapshot for the
// patient dashboard's plan & billing screen.

import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret || secret === "sk_test_REPLACE_ME") {
      return NextResponse.json(
        { success: false, message: "Stripe secret key is not configured." },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const paymentIntentId =
      typeof body.paymentIntentId === "string" ? body.paymentIntentId : "";
    if (!paymentIntentId) {
      return NextResponse.json(
        { success: false, message: "Missing paymentIntentId." },
        { status: 400 },
      );
    }

    const stripe = new Stripe(secret);
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["payment_method"],
    });

    if (intent.status !== "succeeded") {
      return NextResponse.json(
        { success: false, message: `Payment status is ${intent.status}.` },
        { status: 400 },
      );
    }

    const pm = intent.payment_method;
    const card = pm && typeof pm === "object" ? pm.card : null;
    const billing =
      pm && typeof pm === "object" ? pm.billing_details || {} : {};

    return NextResponse.json({
      success: true,
      paymentIntentId: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      paidAt: intent.created * 1000,
      plan: intent.metadata?.plan || "",
      brand: card?.brand || "",
      last4: card?.last4 || "",
      expMonth: card?.exp_month || null,
      expYear: card?.exp_year || null,
      cardholderName: billing.name || "",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
