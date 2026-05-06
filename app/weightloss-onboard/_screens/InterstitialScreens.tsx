"use client";

import { useOnboard } from "./OnboardContext";
import { getCurrentLbs, estimateLossLbs } from "./constants";
import WeightProjection from "./WeightProjection";

export function IGood() {
  const { form, goTo } = useOnboard();

  const currentLbs = getCurrentLbs(form);
  const lossLbs = estimateLossLbs(form, currentLbs);
  const goalLbs = currentLbs - lossLbs;
  const showChart = currentLbs > 0 && goalLbs > 0 && goalLbs < currentLbs;

  return (
    <div className="inter inter-good">
      <div className="ibg" />
      <div className="ic center">
        <div className="ic-body">
          <div className="ititle">Good news!</div>
          <div className="ibody">
            Based on this info, <strong>you may be eligible</strong>{" "}
            for GLP-1 treatment. Here&apos;s what your journey could
            look like:
          </div>

          {showChart && (
            <WeightProjection
              currentLbs={currentLbs}
              goalLbs={goalLbs}
            />
          )}
        </div>
        <button
          type="button"
          className="icta"
          onClick={() => goTo("iRoad")}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export function IRoad() {
  const { goTo } = useOnboard();

  return (
    <div className="inter inter-road">
      <div className="ibg" />
      <div className="ic center">
        <div className="ic-body">
          <div className="ir-hero" aria-hidden>
            <svg
              className="ir-hero-svg"
              viewBox="0 0 380 120"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="irPath" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--wlf-brand)" />
                  <stop offset="100%" stopColor="var(--wlf-brand-light)" />
                </linearGradient>
              </defs>

              <path
                d="M 50 60 C 110 60, 130 60, 160 60 S 230 60, 270 60 S 340 60, 360 60"
                stroke="var(--wlf-border-strong)"
                strokeWidth="2"
                strokeDasharray="3 5"
                fill="none"
                strokeLinecap="round"
              />

              <path
                className="ir-hero-path"
                d="M 50 60 C 110 60, 130 60, 160 60 S 230 60, 270 60 S 340 60, 360 60"
                stroke="url(#irPath)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                pathLength={1}
              />

              {[
                { cx: 50,  delay: "0s",   icon: "♡",  size: 14 },
                { cx: 153, delay: "0.6s", icon: "✓",  size: 14 },
                { cx: 256, delay: "1.2s", icon: "📅", size: 12 },
                { cx: 360, delay: "1.8s", icon: "★",  size: 14 },
              ].map((m, i) => (
                <g key={i} className="ir-hero-node" style={{ animationDelay: m.delay }}>
                  <circle
                    cx={m.cx} cy="60" r="22"
                    fill="var(--wlf-brand-soft)"
                    className="ir-hero-halo"
                    style={{ animationDelay: m.delay }}
                  />
                  <circle
                    cx={m.cx} cy="60" r="14"
                    fill="var(--wlf-brand)"
                    stroke="#fff"
                    strokeWidth="2.5"
                    className="ir-hero-dot"
                    style={{ animationDelay: m.delay }}
                  />
                  <text
                    x={m.cx} y="65"
                    textAnchor="middle"
                    fontSize={m.size}
                    fill="#fff"
                    fontWeight="700"
                    className="ir-hero-icon"
                    style={{ animationDelay: m.delay }}
                  >
                    {m.icon}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="ititle ir-title">
            Great! Now a few questions
          </div>
          <div className="ibody ir-sub">
            Here&apos;s what&apos;s next on your journey to a personalised plan.
          </div>

          <div className="ir-steps">
            <div className="ir-step is-active">
              <div className="ir-step-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <div className="ir-step-text">
                <div className="ir-step-row">
                  <span className="ir-step-title">Health questions</span>
                  <span className="ir-step-pill">3–4 min</span>
                </div>
                <div className="ir-step-desc">
                  Answer a few questions about your goals and history.
                </div>
              </div>
            </div>

            <div className="ir-step">
              <div className="ir-step-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div className="ir-step-text">
                <div className="ir-step-row">
                  <span className="ir-step-title">See your match</span>
                  <span className="ir-step-pill ir-step-pill-soft">Instant</span>
                </div>
                <div className="ir-step-desc">
                  Get matched with a treatment plan tailored to you.
                </div>
              </div>
            </div>

            <div className="ir-step">
              <div className="ir-step-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
              <div className="ir-step-text">
                <div className="ir-step-row">
                  <span className="ir-step-title">Book consultation</span>
                  <span className="ir-step-pill ir-step-pill-soft">15 min</span>
                </div>
                <div className="ir-step-desc">
                  Pick a time that works — meet your physician on video.
                </div>
              </div>
            </div>

            <div className="ir-step">
              <div className="ir-step-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="ir-step-text">
                <div className="ir-step-row">
                  <span className="ir-step-title">Start your plan</span>
                  <span className="ir-step-pill ir-step-pill-soft">2–3 days</span>
                </div>
                <div className="ir-step-desc">
                  Receive medication shipped discreetly to your door.
                </div>
              </div>
            </div>
          </div>

          <div className="ir-trust">
            <div className="ir-trust-item">
              <span className="ir-trust-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              Licensed physicians
            </div>
            <div className="ir-trust-item">
              <span className="ir-trust-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              HIPAA secure
            </div>
            <div className="ir-trust-item">
              <span className="ir-trust-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </span>
              Cancel anytime
            </div>
          </div>
        </div>
        <button
          type="button"
          className="icta"
          onClick={() => goTo("s4")}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
