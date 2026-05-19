"use client";

import dynamic from "next/dynamic";
import { auth } from "@/lib/firebase/auth";
import { PlanCard } from "../components";
import { useOnboard } from "./OnboardContext";

// Map the patient's chosen GLP-1 medication to a doctor-facing
// appointment type. Unknown / unselected falls back to "Initial consultation".
function pickAppointmentType(glpMed) {
  const m = String(glpMed || "").toLowerCase();
  if (m.includes("ozempic")) return "Ozempic";
  if (m.includes("wegovy")) return "Wegovy";
  if (m.includes("zepbound") || m.includes("tirzepatide")) return "Zepbound";
  return "Initial consultation";
}

async function bookAppointmentBestEffort(form) {
  if (!form.doctorUid || !form.slotDate || !form.slotTime) return;
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return;
    await fetch("/api/appointments/book", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        doctorUid: form.doctorUid,
        date: form.slotDate,
        time: form.slotTime,
        type: pickAppointmentType(form.glpMed),
      }),
    });
  } catch (err) {
    // Non-fatal — payment already succeeded, this is just the calendar entry.
    // eslint-disable-next-line no-console
    console.warn("[booking] failed to create appointment record:", err);
  }
}

const StripePayment = dynamic(() => import("../StripePayment"), {
  ssr: false,
  loading: () => (
    <div className="pay-loading">
      <div className="pay-spinner" />
      <span>Preparing secure payment…</span>
    </div>
  ),
});

export function SPlan() {
  const { form, updateField, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="slabel">Choose your plan</div>
      <PlanCard
        selectedPlanId={form.plan}
        onSelectPlan={(planId) => updateField("plan", planId)}
      />
      <button
        type="button"
        className="cta cta-plan"
        onClick={() => goTo("sPay")}
      >
        Continue
      </button>
    </div>
  );
}

export function SPay() {
  const { form, updateField, goTo, selectedPlan, submitMauticOnComplete } = useOnboard();

  return (
    <div className="sc">
      <div className="slabel">Payment</div>
      <div className="q">Secure your plan</div>
      <div className="qs">
        Complete your one-time payment to activate your{" "}
        {selectedPlan?.label ?? "plan"}.
      </div>
      <StripePayment
        email={form.email}
        name={`${form.firstName} ${form.lastName}`.trim()}
        zip={form.zip}
        plan={form.plan}
        planLabel={selectedPlan?.label ?? ""}
        onSuccess={(receipt = {}) => {
          updateField("paid", true);
          updateField("paidAt", receipt.paidAt || Date.now());
          updateField("paymentIntentId", receipt.paymentIntentId || "");
          updateField("paymentAmount", receipt.amount ?? null);
          updateField("paymentCurrency", receipt.currency || "");
          updateField("paymentBrand", receipt.brand || "");
          updateField("paymentLast4", receipt.last4 || "");
          updateField("paymentExpMonth", receipt.expMonth || null);
          updateField("paymentExpYear", receipt.expYear || null);
          updateField("paymentCardholder", receipt.cardholderName || "");
          // Create the calendar entry in the appointments collection so it
          // shows up on both the patient and doctor dashboards. Fire-and-
          // forget — if it fails we still let the patient through, since
          // their onboarding fields capture the slot as a backup record.
          bookAppointmentBestEffort(form);
          submitMauticOnComplete({ paid: true }, "iConfirm");
          goTo("iConfirm");
        }}
      />
    </div>
  );
}
