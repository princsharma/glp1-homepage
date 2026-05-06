"use client";

import { Multi } from "../components";
import { ETHNICITIES } from "../data";
import { isAtLeastAge, isValidEmail, isValidName, isValidPhone } from "../utils";
import { useOnboard } from "./OnboardContext";
import { MIN_AGE_YEARS } from "./constants";

export function S19() {
  const { form, toggleValue, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">What is your ethnicity?</div>
      <div className="qs">
        We ask this to better tailor treatment options to you.
      </div>
      <Multi
        options={ETHNICITIES}
        values={form.s19}
        onToggle={(value) => toggleValue("s19", value)}
      />
      <button
        type="button"
        className="cta"
        disabled={form.s19.length === 0}
        onClick={() => goTo("s21")}
      >
        Continue
      </button>
    </div>
  );
}

export function S20Email() {
  const {
    form,
    updateField,
    goTo,
    emailScreenIsValid,
    submitMauticOnEmailCapture,
  } = useOnboard();

  return (
    <div className="sc">
      <div className="q">Find the right treatment for you</div>
      <div className="qs">
        Enter your email to see options tailored to your goals and
        health history.
      </div>
      <input
        className="inp"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(event) => updateField("email", event.target.value)}
      />
      {form.email.length > 0 && !isValidEmail(form.email) && (
        <div className="field-err">
          Please enter a valid email address.
        </div>
      )}
      <div className="opts" style={{ gap: 7 }}>
        <label
          className={`opt consent ${form.consentH ? "sel" : ""}`}
          onClick={() => updateField("consentH", !form.consentH)}
        >
          <span className="chk">✓</span>
          <span className="consent-text">
            I agree to the <a href="#">HIPAA Authorization</a>
          </span>
        </label>
        <label
          className={`opt consent ${form.consentT ? "sel" : ""}`}
          onClick={() => updateField("consentT", !form.consentT)}
        >
          <span className="chk">✓</span>
          <span className="consent-text">
            I agree to the <a href="#">Telehealth Consent</a>,{" "}
            <a href="#">Terms of Use</a> and{" "}
            <a href="#">Privacy Policy</a>
          </span>
        </label>
      </div>
      <button
        type="button"
        className="cta"
        disabled={!emailScreenIsValid}
        onClick={() => {
          submitMauticOnEmailCapture();
          goTo("s3");
        }}
      >
        Continue
      </button>
      <div className="or-row">
        <div className="line" />
        <span className="or">OR</span>
        <div className="line" />
      </div>
      <button type="button" className="cta2 google-btn">
        <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden>
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}

export function S21() {
  const { form, updateField, goTo, maxDobDate, profileScreenIsValid } = useOnboard();

  return (
    <div className="sc">
      <div className="q">Complete your profile</div>
      <div className="qs">
        Your healthcare team will need this for treatment and
        prescriptions.
      </div>
      <div className="r2">
        <input
          className="inp"
          style={{ margin: 0 }}
          type="text"
          placeholder="First name"
          value={form.firstName}
          onChange={(event) => updateField("firstName", event.target.value)}
        />
        <input
          className="inp"
          style={{ margin: 0 }}
          type="text"
          placeholder="Last name"
          value={form.lastName}
          onChange={(event) => updateField("lastName", event.target.value)}
        />
      </div>
      {form.firstName.length > 0 && !isValidName(form.firstName) && (
        <div className="field-err">
          First name must be at least 2 characters.
        </div>
      )}
      {form.lastName.length > 0 && !isValidName(form.lastName) && (
        <div className="field-err">
          Last name must be at least 2 characters.
        </div>
      )}
      <div className="r2" style={{ marginTop: 8 }}>
        <input
          className="inp"
          style={{ margin: 0 }}
          type="date"
          max={maxDobDate}
          value={form.dob}
          onChange={(event) => updateField("dob", event.target.value)}
        />
        <input
          className="inp"
          style={{ margin: 0 }}
          type="text"
          inputMode="numeric"
          placeholder="ZIP code"
          maxLength={5}
          value={form.zip}
          onChange={(event) => updateField("zip", event.target.value)}
        />
      </div>
      {form.dob.length > 0 && !isAtLeastAge(form.dob, MIN_AGE_YEARS) && (
        <div className="field-err">
          You must be at least {MIN_AGE_YEARS} year
          {MIN_AGE_YEARS === 1 ? "" : "s"} old.
        </div>
      )}
      <input
        className="inp"
        type="tel"
        inputMode="numeric"
        placeholder="Phone number"
        maxLength={12}
        value={form.phone}
        onChange={(event) => {
          const digits = event.target.value
            .replace(/\D/g, "")
            .slice(0, 12);
          updateField("phone", digits);
        }}
      />
      {form.phone.length > 0 && !isValidPhone(form.phone) && (
        <div className="field-err">
          Please enter a valid phone number (10–12 digits).
        </div>
      )}
      <input
        className="inp"
        type="text"
        placeholder="Street address"
        value={form.address}
        onChange={(event) => updateField("address", event.target.value)}
      />
      <button
        type="button"
        className="cta"
        disabled={!profileScreenIsValid}
        onClick={() => goTo("s22")}
      >
        Continue
      </button>
    </div>
  );
}

export function S22() {
  const { form, updateField, goTo } = useOnboard();

  return (
    <div className="sc">
      <div className="q">
        Are you currently taking any medications or supplements?
      </div>
      <div className="qs">
        Include all prescriptions, OTC medications, and supplements.
      </div>
      <textarea
        className="inp"
        placeholder="e.g. Metformin 500mg, Fish Oil, Aspirin 81mg — or type None"
        value={form.meds}
        onChange={(event) => updateField("meds", event.target.value)}
      />
      <div className="q" style={{ fontSize: 16, marginBottom: 6 }}>
        Do you have any allergies?
      </div>
      <input
        className="inp"
        type="text"
        placeholder="e.g. Penicillin — or type None"
        value={form.allergies}
        onChange={(event) => updateField("allergies", event.target.value)}
      />
      <div className="q" style={{ fontSize: 16, marginBottom: 6 }}>
        Which pharmacy would you like to use?
      </div>
      <input
        className="inp"
        type="text"
        placeholder="e.g. CVS, 123 Main St (optional)"
        value={form.pharmacy}
        onChange={(event) => updateField("pharmacy", event.target.value)}
      />
      <button
        type="button"
        className="cta"
        onClick={() => goTo("s22b")}
      >
        Continue
      </button>
    </div>
  );
}
