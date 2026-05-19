// services/email/validate.js
//
// Server-side email plausibility check. Runs in three steps, ordered cheapest
// to most expensive, with short-circuits so we don't do a DNS lookup for an
// obviously malformed string.
//
//   1. Syntax        — regex
//   2. Disposable    — in-memory Set lookup
//   3. Domain MX     — DNS query (typically <500ms)
//
// We do NOT perform SMTP-level mailbox probing (sending RCPT TO and reading
// the reply). It's unreliable — most providers either reject probes outright
// or return false positives via catch-all rules — and it tends to get the
// sending IP onto spam blocklists. DNS MX presence is the right level of
// confidence for an upfront signup check.
//
// Result shape:
//   { valid: true,  reason: "ok"        , message: "Email looks good." }
//   { valid: false, reason: "syntax"    , message: "..." }
//   { valid: false, reason: "disposable", message: "..." }
//   { valid: false, reason: "no_mx"     , message: "..." }
//   { valid: true,  reason: "lookup_failed", message: "..." }  // DNS hiccup → permit

import { promises as dns } from "node:dns";
import { isDisposableDomain } from "./disposable-domains";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MAX_DOMAIN_LENGTH = 253;
const MAX_LOCAL_LENGTH = 64;

export async function validateEmailAddress(rawEmail) {
  const email = (rawEmail || "").trim().toLowerCase();

  // 1. Basic structure + length sanity. We're permissive (RFC compliance is
  //    famously over-eager) but reject obviously-wrong strings.
  if (!email || !EMAIL_REGEX.test(email)) {
    return {
      valid: false,
      reason: "syntax",
      message: "Please enter a valid email address.",
    };
  }
  const at = email.lastIndexOf("@");
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > MAX_LOCAL_LENGTH || domain.length > MAX_DOMAIN_LENGTH) {
    return {
      valid: false,
      reason: "syntax",
      message: "Please enter a valid email address.",
    };
  }

  // 2. Disposable domain blocklist. Cheap Set lookup, no network.
  if (isDisposableDomain(email)) {
    return {
      valid: false,
      reason: "disposable",
      message:
        "Please use a permanent email address — temporary mailbox services aren't supported.",
    };
  }

  // 3. DNS MX records. Confirms the domain is actually capable of receiving
  //    email (catches typos like gmial.com, fake TLDs, parked domains).
  try {
    const mx = await dns.resolveMx(domain);
    if (!Array.isArray(mx) || mx.length === 0) {
      return {
        valid: false,
        reason: "no_mx",
        message:
          "This email domain can't receive mail. Please double-check the address.",
      };
    }
  } catch (err) {
    const code = err?.code || "";
    if (code === "ENOTFOUND" || code === "ENODATA") {
      return {
        valid: false,
        reason: "no_mx",
        message:
          "This email domain doesn't seem to exist. Please check the spelling.",
      };
    }
    // Resolver flaked — don't punish the user for our DNS hiccup. Let them
    // through; Firebase Auth's own validation will still catch flagrant junk.
    return {
      valid: true,
      reason: "lookup_failed",
      message:
        "We couldn't fully verify the email, but it looks OK. You can continue.",
    };
  }

  return {
    valid: true,
    reason: "ok",
    message: "Email looks good.",
  };
}
