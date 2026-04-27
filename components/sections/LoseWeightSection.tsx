import styles from "./LoseWeightSection.module.css";

const benefits = [
  { icon: "✋", text: "Reducing hunger and cravings" },
  { icon: "◐", text: 'Creating "fullness" faster' },
  { icon: "📈", text: "Enabling lifestyle improvements" },
];

export default function LoseWeightSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
      <div className={styles.loseweight_inner}>
        
        {/* LEFT: Content */}
        <div className={styles.content}>
          <h2 className={styles.heading}>
            Lose weight with a
            <br />
            plan made{" "}
            <span className={styles.headingAccent}>just for you</span>
          </h2>

          <p className={styles.subcopy}>
            Our program is designed to make weight loss uncomplicated and
            within reach. It&apos;s quick &amp; easy to administer and can
            improve your physical and emotional health by:
          </p>

          <ul className={styles.benefitList}>
            {benefits.map((b, i) => (
              <li key={i} className={styles.benefitItem}>
                <span className={styles.benefitIcon} aria-hidden="true">
                  {b.icon}
                </span>
                <span className={styles.benefitText}>{b.text}</span>
              </li>
            ))}
          </ul>

          <button className={styles.primaryBtn}>Get Started</button>
        </div>

        {/* RIGHT: Image + floating weight chip */}
        <div className={styles.visual}>
          <div className={styles.imageWrapper}>
              <img
                src="/images/fat-girl.png"
                alt="Person before weight loss program"
                className={`${styles.heroImage} ${styles.heroImageBefore}`}
              />
              <img
                src="/images/slim-girl.png"
                alt="Person after weight loss program"
                className={`${styles.heroImage} ${styles.heroImageAfter}`}
              />
            </div>
          {/* Glassmorphic weight chip */}
          <div className={styles.weightChip}>
            <div className={styles.chipHeader}>
              <span className={styles.chipLabel}>Your Weight</span>
              <span className={styles.chipValue}>
                <span className={styles.chipArrow} aria-hidden="true">
                  ↓
                </span>
                35 lbs
              </span>
            </div>
            <svg
              viewBox="0 0 200 60"
              className={styles.chipChart}
              aria-hidden="true"
            >
              {/* Line + dots showing weight trending down */}
              <polyline
                points="10,15 50,18 90,12 130,30 170,40 190,48"
                fill="none"
                stroke="rgba(255, 255, 255, 0.95)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {[
                [10, 15],
                [50, 18],
                [90, 12],
                [130, 30],
                [170, 40],
                [190, 48],
              ].map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="white"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1"
                />
              ))}
            </svg>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}