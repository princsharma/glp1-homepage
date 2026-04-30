import styles from "./CTAButton.module.css";

// The rotating text — repeats once around the circle.
// Keep it short so all characters fit comfortably around 360°.
const ROTATING_TEXT = "★ MODERN HEALTHCARE · MODERN CARE  ";

export default function CTAButton() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Eyebrow */}
        <p className={styles.eyebrow}>
          Clinicians-Supervised Lifestyle Guidance
        </p>

        {/* Headline */}
        <h2 className={styles.heading}>
          A fitness plan designed for
          <br />
          <span className={styles.headingAccent}>long-term success</span>
        </h2>

        {/* Card with image + content */}
        <article className={styles.card}>
          {/* Rotating badge — absolute positioned on card edge */}
          <div className={styles.rotatingBadge} aria-hidden="true">
            <svg viewBox="0 0 200 200" className={styles.rotatingSvg}>
              <defs>
                <path
                  id="circlePath"
                  d="M 100, 100 m -78, 0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0"
                />
              </defs>
              <text className={styles.rotatingText}>
                <textPath href="#circlePath" startOffset="0">
                  {ROTATING_TEXT.repeat(2)}
                </textPath>
              </text>
            </svg>
            {/* Center accent dot */}
            <span className={styles.badgeCenter} />
          </div>

          {/* Left — image */}
          <div className={styles.cardImageWrap}>
            <img
              src="/images/Care coaching and.webp"
              alt="Care coaching specialist"
              className={styles.cardImage}
            />
          </div>

          {/* Right — content */}
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>
              Lifestyle support
              <br />
              made just for you
            </h3>
            <p className={styles.cardText}>
              We believe that progress over perfection matters. That’s why each
              plan includes nutrition tips and physical activity guidance at
              every step of your journey.
            </p>
          </div>
        </article>

        {/* Bottom tagline + linked CTA */}
        <footer className={styles.footer}>
          <p className={styles.footerText}>
           We're promoting safe, steady, and sustainable weight loss.
          </p>
          <a href="#details" className={styles.footerLink}>
            We're here for those who choose progress →
          </a>
        </footer>
      </div>
    </section>
  );
}
