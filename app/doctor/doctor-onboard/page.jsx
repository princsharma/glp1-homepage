// app/doctor/doctor-onboard/page.jsx
//
// Doctor registration. Single-page form covering everything the clinician
// needs to start accepting patients:
//   1. Identity (name, phone)
//   2. Sign-in credentials (email, password)
//   3. Headshot
//   4. Bio
//   5. State licenses (repeating block)
//   6. Weekly availability (one window per day + slot duration)
//   7. Prescription template
//   8. E-signature (canvas pad)
//   9. Banking details (US routing + account)
//
// Submit flow:
//   - Create Firebase Auth user (we never see the password again)
//   - Upload the headshot to Firebase Storage at doctorPhotos/{uid}
//   - Read the signature canvas to a PNG data URL
//   - POST everything (incl. availability) to /api/doctor/signup
//   - Send the user to /dashboard/doctor

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { auth } from "@/lib/firebase/auth";
import { storage } from "@/lib/firebase/storage";
import {
  isValidEmail,
  isValidName,
  isValidPhone,
  isValidPassword,
  passwordValidationMessage,
} from "@/app/weightloss-onboard/utils";
import { US_STATES, LICENSE_TYPES } from "./states";
import SignaturePad from "./SignaturePad";
import styles from "./doctor-onboard.module.css";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const SLOT_OPTIONS = [15, 20, 30, 45, 60];

const emptyLicense = () => ({
  state: "",
  licenseNumber: "",
  licenseType: "MD",
});

function defaultAvailability() {
  const out = {};
  for (const d of DAYS) {
    out[d.key] = {
      enabled: ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(d.key),
      start: "09:00",
      end: "17:00",
    };
  }
  return out;
}

const DEFAULT_RX_TEMPLATE = `Patient: {{patientName}}
Date: {{date}}

Rx:
- Medication: {{medication}}
- Dose: {{dose}}
- Frequency: {{frequency}}
- Duration: {{duration}}

Notes:
{{notes}}

Refills: {{refills}}`;

export default function DoctorOnboardPage() {
  const router = useRouter();
  const sigRef = useRef(null);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    bio: "",
    licenses: [emptyLicense()],
    availability: defaultAvailability(),
    slotDurationMinutes: 30,
    prescriptionTemplate: DEFAULT_RX_TEMPLATE,
    banking: {
      accountHolder: "",
      bankName: "",
      accountType: "checking",
      routingNumber: "",
      accountNumber: "",
    },
    consent: false,
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [signatureFilled, setSignatureFilled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const update = (field, value) =>
    setForm((p) => ({ ...p, [field]: value }));

  const updateLicense = (i, field, value) =>
    setForm((p) => {
      const next = [...p.licenses];
      next[i] = { ...next[i], [field]: value };
      return { ...p, licenses: next };
    });

  const addLicense = () =>
    setForm((p) => ({ ...p, licenses: [...p.licenses, emptyLicense()] }));

  const removeLicense = (i) =>
    setForm((p) => ({
      ...p,
      licenses:
        p.licenses.length === 1 ? p.licenses : p.licenses.filter((_, idx) => idx !== i),
    }));

  const updateDay = (key, patch) =>
    setForm((p) => ({
      ...p,
      availability: { ...p.availability, [key]: { ...p.availability[key], ...patch } },
    }));

  const updateBanking = (field, value) =>
    setForm((p) => ({ ...p, banking: { ...p.banking, [field]: value } }));

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for your headshot.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("Headshot must be under 6 MB.");
      return;
    }
    setError("");
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const pwHint = useMemo(
    () => passwordValidationMessage(form.password),
    [form.password],
  );

  const licensesValid = form.licenses.every(
    (l) => l.state && l.licenseNumber.trim().length >= 2,
  );

  const availabilityValid = Object.values(form.availability).some(
    (d) => d.enabled && d.start && d.end && d.start < d.end,
  );

  const routingValid = /^\d{9}$/.test(form.banking.routingNumber);
  const accountValid =
    /^\d{4,17}$/.test(form.banking.accountNumber.replace(/\s/g, ""));
  const bankingValid =
    isValidName(form.banking.accountHolder) &&
    form.banking.bankName.trim().length >= 2 &&
    routingValid &&
    accountValid;

  const canSubmit =
    isValidName(form.firstName) &&
    isValidName(form.lastName) &&
    isValidEmail(form.email) &&
    isValidPassword(form.password) &&
    isValidPhone(form.phone) &&
    form.bio.trim().length >= 30 &&
    form.licenses.length >= 1 &&
    licensesValid &&
    availabilityValid &&
    form.prescriptionTemplate.trim().length >= 30 &&
    bankingValid &&
    form.consent &&
    !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);

    try {
      // 1. Auth user.
      setSubmitStatus("Creating your account…");
      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email.trim().toLowerCase(),
        form.password,
      );
      const uid = cred.user.uid;

      // 2. Upload headshot (best-effort — non-fatal if it fails).
      let photoURL = "";
      if (photoFile) {
        try {
          setSubmitStatus("Uploading your headshot…");
          const ext = (photoFile.name.split(".").pop() || "jpg").toLowerCase();
          const path = `doctorPhotos/${uid}/headshot.${ext}`;
          const sref = storageRef(storage, path);
          await uploadBytes(sref, photoFile, { contentType: photoFile.type });
          photoURL = await getDownloadURL(sref);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("[doctor-onboard] photo upload failed:", err);
          // Surface a warning later; don't block account creation.
        }
      }

      // 3. Signature data URL.
      const signatureDataUrl = sigRef.current?.getDataUrl() || "";

      // 4. POST profile.
      setSubmitStatus("Saving your profile…");
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/doctor/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          bio: form.bio.trim(),
          licenses: form.licenses.map((l) => ({
            state: l.state,
            licenseNumber: l.licenseNumber.trim(),
            licenseType: l.licenseType,
          })),
          photoURL,
          prescriptionTemplate: form.prescriptionTemplate.trim(),
          signatureDataUrl,
          banking: {
            accountHolder: form.banking.accountHolder.trim(),
            bankName: form.banking.bankName.trim(),
            accountType: form.banking.accountType,
            routingNumber: form.banking.routingNumber.trim(),
            accountNumber: form.banking.accountNumber.replace(/\s/g, ""),
          },
          availability: {
            slotDurationMinutes: form.slotDurationMinutes,
            weeklySchedule: Object.fromEntries(
              Object.entries(form.availability).map(([day, cfg]) => [
                day,
                cfg.enabled ? [{ start: cfg.start, end: cfg.end }] : [],
              ]),
            ),
          },
        }),
      });

      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.message || "Could not finish registration.");
      }

      router.replace("/dashboard/doctor");
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") {
        setError("That email is already registered. Try signing in instead.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Try a longer one.");
      } else {
        setError(err?.message || "Something went wrong. Please try again.");
      }
      setSubmitting(false);
      setSubmitStatus("");
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.hero} aria-hidden>
        <div className={styles.heroOrb} />
      </div>

      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>O</span>
            <span>
              <em className={styles.brandEm}>Ongo</em> for Clinicians
            </span>
          </Link>
          <Link href="/doctor/doctor-login" className={styles.haveAcct}>
            Already have an account? <strong>Sign in</strong>
          </Link>
        </header>

        <div className={styles.titleBlock}>
          <span className={styles.kicker}>Doctor registration</span>
          <h1 className={styles.title}>Join the Ongo care network.</h1>
          <p className={styles.subtitle}>
            Set up your clinician profile, licensure, availability, and payout
            details. Patients can book you the moment you finish.
          </p>
        </div>

        <form className={styles.card} onSubmit={handleSubmit} noValidate>
          {/* 1 ── Identity */}
          <Section number="1" title="Your details">
            <div className={styles.row2}>
              <Field label="First name" required>
                <input
                  className={styles.input}
                  type="text"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="Vanessa"
                />
              </Field>
              <Field label="Last name" required>
                <input
                  className={styles.input}
                  type="text"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Niles"
                />
              </Field>
            </div>

            <Field label="Phone" required hint="We never share this with patients.">
              <input
                className={styles.input}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </Field>
          </Section>

          {/* 2 ── Credentials */}
          <Section number="2" title="Sign-in credentials">
            <Field label="Work email" required>
              <input
                className={styles.input}
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="vanessa@your-clinic.com"
              />
            </Field>
            <Field
              label="Password"
              required
              hint={pwHint || "At least 8 characters with one letter and one number."}
              hintTone={pwHint ? "warn" : "muted"}
            >
              <div className={styles.pwWrap}>
                <input
                  className={styles.input}
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className={styles.pwToggle}
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </Field>
          </Section>

          {/* 3 ── Headshot */}
          <Section
            number="3"
            title="Profile photo"
            description="Patients see this when choosing their clinician. JPG or PNG, up to 6 MB."
          >
            <div className={styles.photoRow}>
              <div className={styles.photoPreview}>
                {photoPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreviewUrl} alt="Headshot preview" />
                ) : (
                  <span>{(form.firstName?.[0] || "D").toUpperCase()}</span>
                )}
              </div>
              <div className={styles.photoActions}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onPickPhoto}
                  style={{ display: "none" }}
                  id="doctor-headshot"
                />
                <label htmlFor="doctor-headshot" className={styles.photoBtn}>
                  {photoFile ? "Choose a different photo" : "Choose headshot"}
                </label>
                {photoFile && (
                  <button
                    type="button"
                    className={styles.photoRemove}
                    onClick={clearPhoto}
                  >
                    Remove
                  </button>
                )}
                <span className={styles.photoHint}>
                  Square crops look best · 600×600+ recommended
                </span>
              </div>
            </div>
          </Section>

          {/* 4 ── Bio */}
          <Section number="4" title="About you">
            <Field
              label="Professional bio"
              required
              hint={`${form.bio.trim().length}/600 characters · minimum 30`}
              hintTone={form.bio.trim().length < 30 ? "warn" : "muted"}
            >
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                rows={5}
                maxLength={600}
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
                placeholder="Board-certified physician with 10+ years in metabolic health. Trained at…"
              />
            </Field>
          </Section>

          {/* 5 ── Licenses */}
          <Section
            number="5"
            title="State licenses"
            description="Add every state you're currently licensed to practice in. You can add more later from your dashboard."
          >
            <div className={styles.licenses}>
              {form.licenses.map((lic, i) => (
                <div key={i} className={styles.licenseRow}>
                  <div className={styles.licenseHeader}>
                    <span className={styles.licenseBadge}>License #{i + 1}</span>
                    {form.licenses.length > 1 && (
                      <button
                        type="button"
                        className={styles.licenseRemove}
                        onClick={() => removeLicense(i)}
                        aria-label={`Remove license ${i + 1}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <Field label="State" required>
                    <select
                      className={styles.input}
                      value={lic.state}
                      onChange={(e) => updateLicense(i, "state", e.target.value)}
                    >
                      <option value="">Choose a state…</option>
                      {US_STATES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className={styles.row2}>
                    <Field label="License number" required>
                      <input
                        className={styles.input}
                        type="text"
                        value={lic.licenseNumber}
                        onChange={(e) =>
                          updateLicense(i, "licenseNumber", e.target.value)
                        }
                        placeholder="ME-12345"
                      />
                    </Field>
                    <Field label="License type">
                      <select
                        className={styles.input}
                        value={lic.licenseType}
                        onChange={(e) =>
                          updateLicense(i, "licenseType", e.target.value)
                        }
                      >
                        {LICENSE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className={styles.addBtn}
                onClick={addLicense}
              >
                + Add another state license
              </button>
            </div>
          </Section>

          {/* 6 ── Availability */}
          <Section
            number="6"
            title="Weekly availability"
            description="Set your default consultation hours. You can fine-tune (multiple windows per day, blocked dates) from your dashboard later."
          >
            <div className={styles.slotDurationRow}>
              <span className={styles.fieldLabel}>Slot duration</span>
              <div className={styles.pillGroup}>
                {SLOT_OPTIONS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    className={`${styles.pill} ${form.slotDurationMinutes === mins ? styles.pillActive : ""}`}
                    onClick={() => update("slotDurationMinutes", mins)}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.dayList}>
              {DAYS.map((d) => {
                const cfg = form.availability[d.key];
                const invalid =
                  cfg.enabled && cfg.start && cfg.end && cfg.start >= cfg.end;
                return (
                  <div key={d.key} className={styles.dayRow}>
                    <label className={styles.dayToggle}>
                      <input
                        type="checkbox"
                        checked={cfg.enabled}
                        onChange={(e) => updateDay(d.key, { enabled: e.target.checked })}
                      />
                      <span>{d.label}</span>
                    </label>
                    <input
                      type="time"
                      className={`${styles.timeInput} ${invalid ? styles.timeInputErr : ""}`}
                      value={cfg.start}
                      onChange={(e) => updateDay(d.key, { start: e.target.value })}
                      disabled={!cfg.enabled}
                    />
                    <span className={styles.timeDash}>→</span>
                    <input
                      type="time"
                      className={`${styles.timeInput} ${invalid ? styles.timeInputErr : ""}`}
                      value={cfg.end}
                      onChange={(e) => updateDay(d.key, { end: e.target.value })}
                      disabled={!cfg.enabled}
                    />
                  </div>
                );
              })}
            </div>
            {!availabilityValid && (
              <p className={styles.fieldHintWarn} style={{ marginTop: 6 }}>
                Pick at least one day with a valid start/end window.
              </p>
            )}
          </Section>

          {/* 7 ── Prescription template */}
          <Section
            number="7"
            title="Prescription template"
            description="Used as the default starting text whenever you issue a prescription. Tokens like {{patientName}} get filled in automatically."
          >
            <Field
              label="Template"
              required
              hint={`${form.prescriptionTemplate.trim().length} characters · minimum 30`}
              hintTone={form.prescriptionTemplate.trim().length < 30 ? "warn" : "muted"}
            >
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                rows={9}
                value={form.prescriptionTemplate}
                onChange={(e) => update("prescriptionTemplate", e.target.value)}
                placeholder="Patient: {{patientName}}&#10;Date: {{date}}…"
                style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }}
              />
            </Field>
          </Section>

          {/* 8 ── Signature (optional) */}
          <Section
            number="8"
            title="E-signature"
            description="Optional. We'll stamp this on prescriptions and chart notes you sign off. You can add it later from your profile."
          >
            <Field
              label="Sign below"
              hint={signatureFilled ? "Signature captured." : "Optional — skip if you'd rather add it later."}
            >
              <SignaturePad
                refHandle={sigRef}
                height={180}
                onChange={() => setSignatureFilled(!sigRef.current?.isEmpty())}
              />
            </Field>
          </Section>

          {/* 9 ── Banking */}
          <Section
            number="9"
            title="Banking details (payouts)"
            description="Where we send your share of patient payments. US bank accounts only — routing number is 9 digits."
          >
            <Field label="Account holder name" required>
              <input
                className={styles.input}
                type="text"
                autoComplete="off"
                value={form.banking.accountHolder}
                onChange={(e) => updateBanking("accountHolder", e.target.value)}
                placeholder="Vanessa A. Niles"
              />
            </Field>

            <div className={styles.row2}>
              <Field label="Bank name" required>
                <input
                  className={styles.input}
                  type="text"
                  autoComplete="off"
                  value={form.banking.bankName}
                  onChange={(e) => updateBanking("bankName", e.target.value)}
                  placeholder="Chase Bank"
                />
              </Field>
              <Field label="Account type" required>
                <select
                  className={styles.input}
                  value={form.banking.accountType}
                  onChange={(e) => updateBanking("accountType", e.target.value)}
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </Field>
            </div>

            <div className={styles.row2}>
              <Field
                label="Routing number"
                required
                hint={
                  form.banking.routingNumber.length === 0
                    ? "9-digit ABA routing"
                    : routingValid
                      ? "Looks good."
                      : "Routing must be exactly 9 digits."
                }
                hintTone={
                  form.banking.routingNumber.length === 0 || routingValid
                    ? "muted"
                    : "warn"
                }
              >
                <input
                  className={styles.input}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={9}
                  value={form.banking.routingNumber}
                  onChange={(e) =>
                    updateBanking("routingNumber", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="123456789"
                />
              </Field>
              <Field
                label="Account number"
                required
                hint={
                  form.banking.accountNumber.length === 0
                    ? "Usually 4–17 digits"
                    : accountValid
                      ? "Looks good."
                      : "Account number should be 4–17 digits."
                }
                hintTone={
                  form.banking.accountNumber.length === 0 || accountValid
                    ? "muted"
                    : "warn"
                }
              >
                <input
                  className={styles.input}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={17}
                  value={form.banking.accountNumber}
                  onChange={(e) =>
                    updateBanking("accountNumber", e.target.value.replace(/[^\d\s]/g, ""))
                  }
                  placeholder="000123456789"
                />
              </Field>
            </div>
            <p className={styles.bankNote}>
              🔒 Encrypted in transit. For production use, payouts should be
              routed through Stripe Connect rather than stored as plain
              numbers.
            </p>
          </Section>

          {/* Consent + submit */}
          <label className={styles.consent}>
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => update("consent", e.target.checked)}
            />
            <span>
              I confirm the licenses, signature, and banking details above are
              accurate, and I agree to Ongo&apos;s clinician terms.
            </span>
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.submit}
            disabled={!canSubmit}
          >
            {submitting
              ? submitStatus || "Creating your profile…"
              : "Create my doctor account"}
          </button>
        </form>
      </div>
    </main>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────── */

function Section({ number, title, description, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionNum}>{number}</span>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {description && <p className={styles.sectionDesc}>{description}</p>}
        </div>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Field({ label, required, hint, hintTone, children }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </span>
      {children}
      {hint && (
        <span
          className={
            hintTone === "warn"
              ? `${styles.fieldHint} ${styles.fieldHintWarn}`
              : styles.fieldHint
          }
        >
          {hint}
        </span>
      )}
    </label>
  );
}
