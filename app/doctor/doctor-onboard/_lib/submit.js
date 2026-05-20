// app/doctor/doctor-onboard/_lib/submit.js
//
// Multi-step doctor signup action — kept as a plain async function so it
// can be invoked from the form hook, tested in isolation, and reasoned
// about as a linear pipeline:
//
//   1. createUserWithEmailAndPassword       → Firebase Auth user
//   2. uploadBytes (best-effort, non-fatal) → headshot in Firebase Storage
//   3. POST /api/doctor/signup              → Firestore profile + auth claims
//
// onStatus is called between steps so the UI can show progress; onStatus
// is optional (defaults to a no-op) so callers can omit it in tests.

import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { auth } from "@/lib/firebase/auth";
import { storage } from "@/lib/firebase/storage";

export async function submitDoctorSignup({
  form,
  photoFile,
  signatureDataUrl,
  onStatus = () => {},
}) {
  onStatus("Creating your account…");
  const cred = await createUserWithEmailAndPassword(
    auth,
    form.email.trim().toLowerCase(),
    form.password,
  );
  const uid = cred.user.uid;

  const photoURL = await uploadHeadshot({ uid, photoFile, onStatus });

  onStatus("Saving your profile…");
  const idToken = await cred.user.getIdToken();
  const res = await fetch("/api/doctor/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(buildSignupPayload({ form, photoURL, signatureDataUrl })),
  });

  const data = await res.json();
  if (!data?.success) {
    throw new Error(data?.message || "Could not finish registration.");
  }
  return data;
}

// Best-effort upload — a failed photo shouldn't block account creation.
// We log a warning and proceed with an empty photoURL.
async function uploadHeadshot({ uid, photoFile, onStatus }) {
  if (!photoFile) return "";
  try {
    onStatus("Uploading your headshot…");
    const ext = (photoFile.name.split(".").pop() || "jpg").toLowerCase();
    const path = `doctorPhotos/${uid}/headshot.${ext}`;
    const sref = storageRef(storage, path);
    await uploadBytes(sref, photoFile, { contentType: photoFile.type });
    return await getDownloadURL(sref);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[doctor-onboard] photo upload failed:", err);
    return "";
  }
}

function buildSignupPayload({ form, photoURL, signatureDataUrl }) {
  return {
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
  };
}

// Map Firebase Auth error codes to user-facing copy. Centralized here so
// the page doesn't have to repeat the catch-block boilerplate.
export function mapSignupError(err) {
  const code = err?.code || "";
  if (code === "auth/email-already-in-use") {
    return "That email is already registered. Try signing in instead.";
  }
  if (code === "auth/weak-password") {
    return "Password is too weak. Try a longer one.";
  }
  return err?.message || "Something went wrong. Please try again.";
}
