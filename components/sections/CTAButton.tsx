import styles from "./CTAButton.module.css";

// The rotating text — repeats once around the circle.
// Keep it short so all characters fit comfortably around 360°.
const ROTATING_TEXT = "WITH YOU FROM START TO SUCCESS · ";

export default function CTAButton() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Eyebrow */}
        <p className={styles.eyebrow}>BETTER IS POSSIBLE — AND WE BUILT FOR IT.</p>

        {/* Headline */}
        <h2 className={styles.heading}>
          Modern healthcare,
          <br />
          <span className={styles.headingAccent}>built around you</span>
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
              src="/cta/care-coaching.jpg"
              alt="Care coaching specialist"
              className={styles.cardImage}
            />
          </div>

          {/* Right — content */}
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>
              Care coaching and
              <br />
              nutrition support
            </h3>
            <p className={styles.cardText}>
              Our care coaching team, led by certified medical assistants and
              registered dietitians, helps answer questions about your
              medication, program, and day-to-day lifestyle changes — so you
              have the guidance you need to stay on track and see results.
            </p>
          </div>
        </article>

        {/* Bottom tagline + linked CTA */}
        <footer className={styles.footer}>
          <p className={styles.footerText}>
            We&apos;re creating a better healthcare experience, and the details
            matter.
          </p>
          <a href="#details" className={styles.footerLink}>
            We&apos;re here for those details →
          </a>
        </footer>
      </div>
    </section>
  );
}