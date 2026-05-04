"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe, type Stripe, type StripeElementStyle } from "@stripe/stripe-js";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const KEY_CONFIGURED =
  PUBLISHABLE_KEY.length > 0 && !PUBLISHABLE_KEY.includes("REPLACE_ME");

let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => {
  if (!KEY_CONFIGURED) return null;
  if (!stripePromise) stripePromise = loadStripe(PUBLISHABLE_KEY);
  return stripePromise;
};

const ELEMENT_STYLE: StripeElementStyle = {
  base: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: "15px",
    color: "#111",
    "::placeholder": { color: "#bbb" },
    iconColor: "#2D6A4F",
  },
  invalid: { color: "#c4302b", iconColor: "#c4302b" },
};

const formatAmount = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);

type PaymentFormProps = {
  email: string;
  name: string;
  defaultZip: string;
  amountCents: number;
  currency: string;
  clientSecret: string;
  planLabel: string;
  monthly: number;
  months: number;
  onSuccess: () => void;
};

function PaymentForm({
  email,
  name: defaultName,
  defaultZip,
  amountCents,
  currency,
  clientSecret,
  planLabel,
  monthly,
  months,
  onSuccess,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState(defaultName);
  const [zip, setZip] = useState(defaultZip);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedAmount = formatAmount(amountCents, currency);
  const ready = stripe !== null && elements !== null;
  const canSubmit = ready && !submitting && name.trim().length >= 2 && zip.trim().length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    setSubmitting(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: name.trim(),
            email,
            address: { postal_code: zip.trim() },
          },
        },
      }
    );

    if (stripeError) {
      setError(stripeError.message ?? "Your card could not be processed.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess();
      return;
    }

    setError("Payment did not complete. Please try again.");
    setSubmitting(false);
  };

  return (
    <form className="pay-form" onSubmit={handleSubmit}>
      <div className="pay-summary">
        <div className="pay-summary-row">
          <span>{planLabel} plan</span>
          <strong>{formattedAmount}</strong>
        </div>
        <div className="pay-summary-note">
          ${monthly}/mo × {months} {months === 1 ? "month" : "months"} · charged today.
        </div>
      </div>

      <label className="pay-label">Cardholder name</label>
      <input
        className="inp"
        type="text"
        placeholder="Name on card"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="cc-name"
      />

      <label className="pay-label">Card number</label>
      <div className="pay-field">
        <CardNumberElement options={{ style: ELEMENT_STYLE, showIcon: true }} />
      </div>

      <div className="r2">
        <div>
          <label className="pay-label">Expiry</label>
          <div className="pay-field">
            <CardExpiryElement options={{ style: ELEMENT_STYLE }} />
          </div>
        </div>
        <div>
          <label className="pay-label">CVC</label>
          <div className="pay-field">
            <CardCvcElement options={{ style: ELEMENT_STYLE }} />
          </div>
        </div>
      </div>

      <label className="pay-label">ZIP / Postal code</label>
      <input
        className="inp"
        type="text"
        inputMode="numeric"
        placeholder="ZIP code"
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        autoComplete="postal-code"
        maxLength={10}
      />

      {error && <div className="field-err">{error}</div>}

      <div className="pay-secure">
        🔒 Payments are encrypted and processed securely by Stripe.
      </div>

      <button type="submit" className="cta cta-pay" disabled={!canSubmit}>
        {submitting ? "Processing…" : `Pay ${formattedAmount}`}
      </button>
    </form>
  );
}

type StripePaymentProps = {
  email: string;
  name: string;
  zip: string;
  plan: string;
  planLabel: string;
  onSuccess: () => void;
};

export default function StripePayment({
  email,
  name,
  zip,
  plan,
  planLabel,
  onSuccess,
}: StripePaymentProps) {
  const stripeP = useMemo(() => getStripe(), []);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("usd");
  const [monthly, setMonthly] = useState<number>(0);
  const [months, setMonths] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!KEY_CONFIGURED) {
      setError("Stripe is not configured yet — add your test keys to .env.");
      return;
    }
    if (!plan) {
      setError("No plan selected.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stripe/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, plan }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data.success || !data.clientSecret) {
          setError(data.message ?? "Could not start payment.");
          return;
        }
        setClientSecret(data.clientSecret);
        if (typeof data.amount === "number") setAmountCents(data.amount);
        if (typeof data.currency === "string") setCurrency(data.currency);
        if (typeof data.monthly === "number") setMonthly(data.monthly);
        if (typeof data.months === "number") setMonths(data.months);
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Network error.";
          setError(message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email, name, plan]);

  if (error) {
    return <div className="field-err pay-fatal">{error}</div>;
  }

  if (!stripeP || !clientSecret) {
    return (
      <div className="pay-loading">
        <div className="pay-spinner" />
        <span>Preparing secure payment…</span>
      </div>
    );
  }

  return (
    <Elements stripe={stripeP}>
      <PaymentForm
        email={email}
        name={name}
        defaultZip={zip}
        amountCents={amountCents}
        currency={currency}
        clientSecret={clientSecret}
        planLabel={planLabel}
        monthly={monthly}
        months={months}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}
