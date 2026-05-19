// app/dashboard/patient/plan/page.jsx
//
// Plan & billing — shows the patient's selected program, the card they paid
// with (brand + last4 + expiry, sourced server-side from Stripe at payment
// time, never re-read from the card itself), when they paid, and when their
// program ends. If the user hasn't paid yet, we show a CTA that sends them
// back into the onboarding payment screen.

"use client";

import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import styles from "../dashboard.module.css";

const PLAN_LABELS = {
  "1m": "1-month program",
  "3m": "3-month program",
  "6m": "6-month program",
};
const PLAN_DURATION_DAYS = { "1m": 30, "3m": 90, "6m": 180 };
const PLAN_MONTHS = { "1m": 1, "3m": 3, "6m": 6 };

export default function PatientPlanPage() {
  const { profile } = useAuthUser();
  const onb = profile?.onboarding || {};

  const planKey = onb.plan || "";
  const planLabel = PLAN_LABELS[planKey] || null;
  const isPaid = !!onb.paid;

  const paidAtMs = toMillis(onb.paidAt);
  const durationDays = PLAN_DURATION_DAYS[planKey] || 0;
  const expiresAtMs =
    paidAtMs && durationDays ? paidAtMs + durationDays * 86400000 : null;
  const daysLeft =
    expiresAtMs != null
      ? Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 86400000))
      : null;
  const totalDays = durationDays || null;
  const progressPct =
    paidAtMs && totalDays
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(((Date.now() - paidAtMs) / (totalDays * 86400000)) * 100),
          ),
        )
      : 0;

  const amountStr = formatAmount(onb.paymentAmount, onb.paymentCurrency);

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Patient · Plan & billing</div>
          <h1 className={styles.pageTitle}>Plan & billing</h1>
          <p className={styles.pageSubtitle}>
            Your active program, payment method, and receipt.
          </p>
        </div>
      </header>

      {!isPaid && (
        <section
          className={styles.card}
          style={{
            borderColor: "#f59e0b",
            background: "linear-gradient(180deg, #fff8eb, var(--color-surface))",
            marginBottom: 16,
          }}
        >
          <div className={styles.cardEyebrow} style={{ color: "#b45309" }}>
            Awaiting payment
          </div>
          <h2 className={styles.cardTitle}>
            Finish your payment to activate {planLabel || "your plan"}.
          </h2>
          <p
            style={{
              margin: "6px 0 14px",
              color: "var(--color-text-muted)",
              fontSize: 14,
            }}
          >
            Once your card is charged, your program clock starts and your
            consultation is locked in.
          </p>
          <Link href="/weightloss-onboard" className={styles.ctaPrimary}>
            Complete payment
          </Link>
        </section>
      )}

      <div className={styles.statRow}>
        <StatTile
          icon={<CardIcon />}
          tone={isPaid ? "green" : "amber"}
          label="Current plan"
          value={planLabel || "Not selected"}
          sub={
            isPaid ? (
              <span className={`${styles.pill} ${styles.pillOk}`}>Active</span>
            ) : (
              <span className={`${styles.pill} ${styles.pillWarn}`}>
                Awaiting payment
              </span>
            )
          }
        />
        <StatTile
          icon={<CalendarIcon />}
          tone="slate"
          label="Started"
          value={paidAtMs ? formatDate(paidAtMs) : "—"}
          sub={paidAtMs ? formatTime(paidAtMs) : "Once you pay"}
        />
        <StatTile
          icon={<ClockIcon />}
          tone="green"
          label="Ends"
          value={expiresAtMs ? formatDate(expiresAtMs) : "—"}
          sub={
            daysLeft != null
              ? daysLeft === 0
                ? "Ends today"
                : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
              : "—"
          }
        />
        <StatTile
          icon={<ReceiptIcon />}
          tone="coral"
          label="Total paid"
          value={amountStr || "—"}
          sub={onb.paymentIntentId ? "1 payment on file" : "—"}
        />
      </div>

      <div className={styles.colSplit}>
        {/* Plan details */}
        <section className={`${styles.card} ${styles.cardHover}`}>
          <div className={styles.cardEyebrow}>
            <CardIcon /> Plan details
          </div>
          <h2 className={styles.cardTitle} style={{ marginBottom: 4 }}>
            {planLabel || "No plan selected"}
          </h2>
          {planKey && (
            <div style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
              {PLAN_MONTHS[planKey]}-month treatment program
            </div>
          )}

          {paidAtMs && totalDays != null && (
            <div className={styles.progressWrap} style={{ marginTop: 18 }}>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className={styles.progressMeta}>
                <span>
                  {daysLeft === 0
                    ? "Plan ends today"
                    : `${daysLeft} of ${totalDays} days remaining`}
                </span>
                <span>{progressPct}%</span>
              </div>
            </div>
          )}

          <div className={styles.row} style={{ marginTop: 14 }}>
            <span className={styles.rowLabel}>Program</span>
            <span className={styles.rowValue}>{planLabel || "—"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Status</span>
            <span className={styles.rowValue}>
              {isPaid ? (
                <span className={`${styles.pill} ${styles.pillOk}`}>Active</span>
              ) : (
                <span className={`${styles.pill} ${styles.pillWarn}`}>
                  Awaiting payment
                </span>
              )}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Started</span>
            <span className={styles.rowValue}>
              {paidAtMs ? formatDateTime(paidAtMs) : "—"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Ends</span>
            <span className={styles.rowValue}>
              {expiresAtMs ? formatDateTime(expiresAtMs) : "—"}
            </span>
          </div>
        </section>

        {/* Payment method */}
        <section className={`${styles.card} ${styles.cardHover}`}>
          <div className={styles.cardEyebrow}>
            <LockIcon /> Payment method
          </div>

          {isPaid && onb.paymentLast4 ? (
            <>
              <div className={styles.creditCard}>
                <div className={styles.creditCardBrand}>
                  {formatBrand(onb.paymentBrand)}
                </div>
                <div className={styles.creditCardNumber}>
                  •••• •••• •••• {onb.paymentLast4}
                </div>
                <div className={styles.creditCardMeta}>
                  <div>
                    <div className={styles.creditCardLabel}>Cardholder</div>
                    <div className={styles.creditCardValue}>
                      {onb.paymentCardholder || "—"}
                    </div>
                  </div>
                  <div>
                    <div className={styles.creditCardLabel}>Expires</div>
                    <div className={styles.creditCardValue}>
                      {formatExpiry(onb.paymentExpMonth, onb.paymentExpYear)}
                    </div>
                  </div>
                </div>
              </div>

              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: 12,
                  color: "var(--color-text-soft)",
                }}
              >
                Stored securely by Stripe. We only keep the last four digits.
              </p>
            </>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIllus}>
                <LockIcon />
              </div>
              <div className={styles.emptyTitle}>No payment on file</div>
              <div className={styles.emptyBody}>
                Once you complete payment, your card details will appear here.
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Receipt */}
      {isPaid && (
        <section className={styles.card} style={{ marginTop: 16 }}>
          <div className={styles.cardEyebrow}>
            <ReceiptIcon /> Receipt
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Date</span>
            <span className={styles.rowValue}>
              {paidAtMs ? formatDateTime(paidAtMs) : "—"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Plan</span>
            <span className={styles.rowValue}>{planLabel || "—"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Card</span>
            <span className={styles.rowValue}>
              {onb.paymentLast4
                ? `${formatBrand(onb.paymentBrand)} •••• ${onb.paymentLast4}`
                : "—"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Amount</span>
            <span className={styles.rowValue}>{amountStr || "—"}</span>
          </div>
          {onb.paymentIntentId && (
            <div className={styles.row}>
              <span className={styles.rowLabel}>Reference</span>
              <span
                className={styles.rowValue}
                style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 }}
              >
                {onb.paymentIntentId}
              </span>
            </div>
          )}
        </section>
      )}
    </>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function StatTile({ icon, tone, label, value, sub }) {
  const toneClass =
    {
      green: styles.statIconGreen,
      coral: styles.statIconCoral,
      slate: styles.statIconSlate,
      amber: styles.statIconAmber,
    }[tone] || styles.statIconSlate;
  return (
    <div className={styles.stat}>
      <div className={`${styles.statIcon} ${toneClass}`}>{icon}</div>
      <div className={styles.statBody}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statSub}>{sub}</div>
      </div>
    </div>
  );
}

function toMillis(value) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDate(ms) {
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(ms) {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTime(ms) {
  return `${formatDate(ms)} · ${formatTime(ms)}`;
}

function formatAmount(amountCents, currency) {
  if (amountCents == null || !currency) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: String(currency).toUpperCase(),
    }).format(amountCents / 100);
  } catch {
    return `$${(amountCents / 100).toFixed(2)}`;
  }
}

function formatBrand(brand) {
  if (!brand) return "Card";
  const map = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
  };
  return map[brand] || brand.charAt(0).toUpperCase() + brand.slice(1);
}

function formatExpiry(month, year) {
  if (!month || !year) return "—";
  const mm = String(month).padStart(2, "0");
  const yy = String(year).slice(-2);
  return `${mm}/${yy}`;
}

/* ─── Icons ──────────────────────────────────────────────────────────── */
function iconProps(size = 16) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
}

function CardIcon() {
  return (
    <svg {...iconProps(20)}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <line x1="3" y1="11" x2="21" y2="11" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg {...iconProps(20)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg {...iconProps(20)}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg {...iconProps(20)}>
      <path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2z" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="16" y2="13" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg {...iconProps(20)}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}
