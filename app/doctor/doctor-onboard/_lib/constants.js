// app/doctor/doctor-onboard/_lib/constants.js
//
// Shape constants for the doctor registration form: weekly availability
// scaffolding, slot-duration choices, default prescription template, and
// the initial form state used by useDoctorOnboardForm.

export const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export const SLOT_OPTIONS = [15, 20, 30, 45, 60];

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

export const emptyLicense = () => ({
  state: "",
  licenseNumber: "",
  licenseType: "MD",
});

export function defaultAvailability() {
  const out = {};
  for (const d of DAYS) {
    out[d.key] = {
      enabled: WEEKDAYS.includes(d.key),
      start: "09:00",
      end: "17:00",
    };
  }
  return out;
}

export const DEFAULT_RX_TEMPLATE = `Patient: {{patientName}}
Date: {{date}}

Rx:
- Medication: {{medication}}
- Dose: {{dose}}
- Frequency: {{frequency}}
- Duration: {{duration}}

Notes:
{{notes}}

Refills: {{refills}}`;

export function initialFormState() {
  return {
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
  };
}
