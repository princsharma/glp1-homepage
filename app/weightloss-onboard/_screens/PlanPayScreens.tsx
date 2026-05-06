"use client";

import StripePayment from "../StripePayment";
import { PlanCard } from "../components";
import { useOnboard } from "./OnboardContext";

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
        onSuccess={() => {
          updateField("paid", true);
          submitMauticOnComplete({ paid: true }, "iConfirm");
          goTo("iConfirm");
        }}
      />
    </div>
  );
}
