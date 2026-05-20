// app/doctor/doctor-onboard/_lib/useDoctorOnboardForm.js
//
// Single hook the doctor-onboard page consumes. Owns the entire form
// lifecycle: values, updaters, photo state, signature filled flag,
// derived validation, submit state, and the submit action itself.
//
// The page passes the SignaturePad ref into submit() at the call site so
// the hook doesn't need a reference to the canvas component.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { passwordValidationMessage } from "@/app/weightloss-onboard/utils";
import { emptyLicense, initialFormState } from "./constants";
import {
  accountValid,
  availabilityValid,
  bankingValid,
  formIsSubmittable,
  licensesValid,
  routingValid,
} from "./validation";
import { mapSignupError, submitDoctorSignup } from "./submit";

export function useDoctorOnboardForm() {
  const fileInputRef = useRef(null);
  const [values, setValues] = useState(initialFormState);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");

  const [signatureFilled, setSignatureFilled] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [error, setError] = useState("");

  // Revoke object URLs on unmount or when a new preview replaces the old.
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  /* ── Updaters ─────────────────────────────────────────────────────── */

  const update = (field, value) =>
    setValues((p) => ({ ...p, [field]: value }));

  const updateLicense = (i, field, value) =>
    setValues((p) => {
      const next = [...p.licenses];
      next[i] = { ...next[i], [field]: value };
      return { ...p, licenses: next };
    });

  const addLicense = () =>
    setValues((p) => ({ ...p, licenses: [...p.licenses, emptyLicense()] }));

  const removeLicense = (i) =>
    setValues((p) => ({
      ...p,
      licenses:
        p.licenses.length === 1
          ? p.licenses
          : p.licenses.filter((_, idx) => idx !== i),
    }));

  const updateDay = (key, patch) =>
    setValues((p) => ({
      ...p,
      availability: {
        ...p.availability,
        [key]: { ...p.availability[key], ...patch },
      },
    }));

  const updateBanking = (field, value) =>
    setValues((p) => ({ ...p, banking: { ...p.banking, [field]: value } }));

  /* ── Photo ────────────────────────────────────────────────────────── */

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

  /* ── Derived ──────────────────────────────────────────────────────── */

  const pwHint = useMemo(
    () => passwordValidationMessage(values.password),
    [values.password],
  );

  const flags = useMemo(
    () => ({
      licensesValid: licensesValid(values.licenses),
      availabilityValid: availabilityValid(values.availability),
      routingValid: routingValid(values.banking.routingNumber),
      accountValid: accountValid(values.banking.accountNumber),
      bankingValid: bankingValid(values.banking),
    }),
    [values.licenses, values.availability, values.banking],
  );

  const canSubmit = !submitting && formIsSubmittable(values);

  /* ── Submit ───────────────────────────────────────────────────────── */

  const submit = async ({ signatureDataUrl }) => {
    if (!canSubmit) return false;
    setError("");
    setSubmitting(true);
    try {
      await submitDoctorSignup({
        form: values,
        photoFile,
        signatureDataUrl,
        onStatus: setSubmitStatus,
      });
      return true;
    } catch (err) {
      setError(mapSignupError(err));
      setSubmitting(false);
      setSubmitStatus("");
      return false;
    }
  };

  return {
    values,
    update,
    updateLicense,
    addLicense,
    removeLicense,
    updateDay,
    updateBanking,
    photoFile,
    photoPreviewUrl,
    fileInputRef,
    onPickPhoto,
    clearPhoto,
    signatureFilled,
    setSignatureFilled,
    pwHint,
    ...flags,
    submitting,
    submitStatus,
    error,
    canSubmit,
    submit,
  };
}
