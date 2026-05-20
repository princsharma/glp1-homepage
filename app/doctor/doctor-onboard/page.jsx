// app/doctor/doctor-onboard/page.jsx
//
// Doctor registration. The page is composition only — all state, updaters,
// validation, and the multi-step submit pipeline live in
// _lib/useDoctorOnboardForm. Each numbered section is its own component
// under _components/.
//
// Submit pipeline (see _lib/submit.js):
//   Firebase Auth user → upload headshot to Storage → POST /api/doctor/signup
//   → redirect to /dashboard/doctor.

"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AvailabilitySection from "./_components/AvailabilitySection";
import BankingSection from "./_components/BankingSection";
import BioSection from "./_components/BioSection";
import CredentialsSection from "./_components/CredentialsSection";
import HeadshotSection from "./_components/HeadshotSection";
import IdentitySection from "./_components/IdentitySection";
import LicensesSection from "./_components/LicensesSection";
import PrescriptionTemplateSection from "./_components/PrescriptionTemplateSection";
import SignatureSection from "./_components/SignatureSection";
import { useDoctorOnboardForm } from "./_lib/useDoctorOnboardForm";
import styles from "./doctor-onboard.module.css";

export default function DoctorOnboardPage() {
  const router = useRouter();
  const sigRef = useRef(null);
  const form = useDoctorOnboardForm();

  const onSubmit = async (e) => {
    e.preventDefault();
    const signatureDataUrl = sigRef.current?.getDataUrl() || "";
    const ok = await form.submit({ signatureDataUrl });
    if (ok) router.replace("/dashboard/doctor");
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

        <form className={styles.card} onSubmit={onSubmit} noValidate>
          <IdentitySection values={form.values} update={form.update} />

          <CredentialsSection
            values={form.values}
            update={form.update}
            pwHint={form.pwHint}
          />

          <HeadshotSection
            values={form.values}
            photoFile={form.photoFile}
            photoPreviewUrl={form.photoPreviewUrl}
            fileInputRef={form.fileInputRef}
            onPickPhoto={form.onPickPhoto}
            clearPhoto={form.clearPhoto}
          />

          <BioSection values={form.values} update={form.update} />

          <LicensesSection
            values={form.values}
            updateLicense={form.updateLicense}
            addLicense={form.addLicense}
            removeLicense={form.removeLicense}
          />

          <AvailabilitySection
            values={form.values}
            update={form.update}
            updateDay={form.updateDay}
            availabilityValid={form.availabilityValid}
          />

          <PrescriptionTemplateSection
            values={form.values}
            update={form.update}
          />

          <SignatureSection
            sigRef={sigRef}
            signatureFilled={form.signatureFilled}
            setSignatureFilled={form.setSignatureFilled}
          />

          <BankingSection
            values={form.values}
            updateBanking={form.updateBanking}
            routingValid={form.routingValid}
            accountValid={form.accountValid}
          />

          <label className={styles.consent}>
            <input
              type="checkbox"
              checked={form.values.consent}
              onChange={(e) => form.update("consent", e.target.checked)}
            />
            <span>
              I confirm the licenses, signature, and banking details above are
              accurate, and I agree to Ongo&apos;s clinician terms.
            </span>
          </label>

          {form.error && <div className={styles.error}>{form.error}</div>}

          <button
            type="submit"
            className={styles.submit}
            disabled={!form.canSubmit}
          >
            {form.submitting
              ? form.submitStatus || "Creating your profile…"
              : "Create my doctor account"}
          </button>
        </form>
      </div>
    </main>
  );
}
