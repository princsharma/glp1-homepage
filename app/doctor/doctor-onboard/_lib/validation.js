// app/doctor/doctor-onboard/_lib/validation.js
//
// Pure predicates over the doctor-registration form values. The form hook
// memoizes these; sections read derived flags (e.g. routingValid) to show
// inline hints.

import {
  isValidEmail,
  isValidName,
  isValidPassword,
  isValidPhone,
} from "@/app/weightloss-onboard/utils";

const ROUTING_RE = /^\d{9}$/;
const ACCOUNT_RE = /^\d{4,17}$/;
const BIO_MIN_LENGTH = 30;
const RX_TEMPLATE_MIN_LENGTH = 30;
const BANK_NAME_MIN_LENGTH = 2;
const LICENSE_NUMBER_MIN_LENGTH = 2;

export function licensesValid(licenses) {
  return licenses.every(
    (l) => l.state && l.licenseNumber.trim().length >= LICENSE_NUMBER_MIN_LENGTH,
  );
}

export function availabilityValid(availability) {
  return Object.values(availability).some(
    (d) => d.enabled && d.start && d.end && d.start < d.end,
  );
}

export function routingValid(routingNumber) {
  return ROUTING_RE.test(routingNumber);
}

export function accountValid(accountNumber) {
  return ACCOUNT_RE.test(accountNumber.replace(/\s/g, ""));
}

export function bankingValid(banking) {
  return (
    isValidName(banking.accountHolder) &&
    banking.bankName.trim().length >= BANK_NAME_MIN_LENGTH &&
    routingValid(banking.routingNumber) &&
    accountValid(banking.accountNumber)
  );
}

export function formIsSubmittable(form) {
  return (
    isValidName(form.firstName) &&
    isValidName(form.lastName) &&
    isValidEmail(form.email) &&
    isValidPassword(form.password) &&
    isValidPhone(form.phone) &&
    form.bio.trim().length >= BIO_MIN_LENGTH &&
    form.licenses.length >= 1 &&
    licensesValid(form.licenses) &&
    availabilityValid(form.availability) &&
    form.prescriptionTemplate.trim().length >= RX_TEMPLATE_MIN_LENGTH &&
    bankingValid(form.banking) &&
    form.consent
  );
}
