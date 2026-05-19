// services/email/disposable-domains.js
//
// Curated blocklist of disposable / throwaway email domains. Catches the
// most common temp-mail services without pulling in the full ~3,000-entry
// list (which adds bundle weight for marginal gain — long-tail providers
// rarely show up in real signups).
//
// Source: distilled from
//   https://github.com/disposable-email-domains/disposable-email-domains
//
// To extend: add the lowercase domain to the Set. Don't include subdomains;
// the validator checks the full domain part of the email exactly.
//
// To temporarily allow a disposable domain during testing (e.g. yopmail),
// comment it out below and the next deploy will accept it.

export const DISPOSABLE_DOMAINS = new Set([
  // Most common
  "mailinator.com",
  "yopmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "maildrop.cc",
  "throwawaymail.com",
  "sharklasers.com",
  "getairmail.com",
  "mytemp.email",
  "mintemail.com",
  "emailondeck.com",
  "dispostable.com",
  "mailnesia.com",
  "mailcatch.com",
  "fakeinbox.com",
  "tempinbox.com",
  "spamgourmet.com",
  "discard.email",
  "discardmail.com",
  "minuteinbox.com",
  "trbvm.com",
  "mvrht.net",
  "spam4.me",
  "mailbox.in.ua",
  "spamty.com",
  "mailforspam.com",
  "mohmal.com",
  "inboxbear.com",
  "onetimemail.com",
  "emltmp.com",

  // Guerrilla aliases
  "guerrillamail.net",
  "guerrillamail.biz",
  "guerrillamail.org",
  "guerrillamail.de",
  "guerrillamailblock.com",

  // YOPmail aliases
  "yopmail.fr",
  "yopmail.net",
  "yopmail.io",
  "cool.fr.nf",
  "jetable.fr.nf",
  "nospam.ze.tc",

  // Trashmail / Anonbox / etc.
  "trashmail.com",
  "trashmail.net",
  "trashmail.io",
  "trashmail.org",
  "trash-mail.com",
  "anonbox.net",
  "anonymbox.com",

  // Misc common
  "byom.de",
  "deadaddress.com",
  "incognitomail.com",
  "incognitomail.org",
  "incognitomail.net",
  "nada.email",
  "tempmailaddress.com",
  "tempmail.ninja",
  "tempinbox.xyz",
  "throwaway.email",
]);

/**
 * Helper: case-insensitive lookup by the domain part of an email.
 * Returns true if the domain is in the blocklist.
 */
export function isDisposableDomain(email) {
  if (typeof email !== "string") return false;
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}
