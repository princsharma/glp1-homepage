import styles from "./LoseWeightSection.module.css";

const benefits = [
  { icon: "✋", text: "1:1 physician guidance" },
  { icon: "◐", text: 'Access to GLP-1 medications (when appropriate)' },
  { icon: "📈", text: "Progress monitoring and adjustment" },
];

export default function LoseWeightSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Descending weight curve in background — drops on hover */}
        <svg
          className={styles.bgCurve}
          viewBox="0 0 1280 540"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Subtle area fill below curve */}
          <path
            d="M 0,180 Q 320,120 640,200 T 1280,260 L 1280,540 L 0,540 Z"
            className={styles.bgCurveFill}
          />
          {/* The actual line */}
          <path
            d="M 0,180 Q 320,120 640,200 T 1280,260"
            className={styles.bgCurveLine}
            fill="none"
          />
          {/* Dots along the curve */}
          {[
            [0, 180],
            [213, 145],
            [427, 165],
            [640, 200],
            [853, 230],
            [1067, 245],
            [1280, 260],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              className={styles.bgCurveDot}
            />
          ))}
        </svg>

        <div className={styles.loseweight_inner}>
          {/* LEFT: Content */}
          <div className={styles.content}>
            <h2 className={styles.heading}>
              Weight loss plan 

              <br />
             tailored to{" "}
              <span className={styles.headingAccent}>your health</span>
            </h2>

            <p className={styles.subcopy}>
             Our program is simple and easy to fit into your routine. We offer: 

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
                src="/images/fat-girl.webp"
                alt="Person before weight loss program"
                className={`${styles.heroImage} ${styles.heroImageBefore}`}
              />
              <img
                src="/images/slim-girl.webp"
                alt="Person after weight loss program"
                className={`${styles.heroImage} ${styles.heroImageAfter}`}
              />
            </div>

            {/* Glassmorphic weight chip */}
            <div className={styles.weightChip}>
              <div className={styles.chipHeader}>
                <span className={styles.chipLabel}>Your Weight</span>
                <span className={styles.chipValue}>
                  <span className={styles.chipArrow} aria-hidden="true">↓</span>
                  35 lbs
                </span>
              </div>
              <svg
                viewBox="0 0 200 60"
                className={styles.chipChart}
                aria-hidden="true"
              >
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