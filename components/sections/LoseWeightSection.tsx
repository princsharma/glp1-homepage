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
      {/* Descending diagonal trend line in background — drops on hover */}
{/* Smooth descending wave curve in background — drops on hover */}
<div  className={styles.bgCurve}>
  <img src="images/graph.png" alt="graph goes down like your weight" />
</div>

        <div className={styles.loseweight_inner}>
          {/* LEFT: Content */}
          <div className={styles.content}>
            <h2 className={styles.heading}>
              GLP-1 Weight loss plan

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

            <a
              href="/weightloss-onboard"
              className={styles.primaryBtn}
              style={{ textDecoration: "none" }}
            >
              Start My Medical Evaluation
            </a>

            <p className={styles.disclaimer}>
              All GLP-1 medications require a doctor's evaluation. Prescription approval is based on medical necessity and aligned with FDA guidelines.
            </p>
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