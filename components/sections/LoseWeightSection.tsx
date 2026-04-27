import styles from "./LoseWeightSection.module.css";
const benefits = [
  { icon: "⚕", text: "Same-day doctor visits and prescriptions" },
  { icon: "℞", text: "Access Ozempic®, Wegovy®, Zepbound®, and other GLP-1s" },
  { icon: "✓", text: "FSA & HSA eligible with all plans" },
];
export default function LoseWeightSection() {
  return (
   <section className={styles.section}>
      <div className={styles.container}>
        {/* LEFT: Content */}
        <div className={styles.content}>
          <span className={styles.badge}>
            <span className={styles.badgeDot} />
            Doctor-reviewed program
          </span>

          <h2 className={styles.heading}>
            Lose weight with a plan{" "}
            <span className={styles.headingAccent}>made just for you</span>
          </h2>

          <ul className={styles.benefitList}>
            {benefits.map((b, i) => (
              <li key={i} className={styles.benefitItem}>
                <span className={styles.benefitIcon}>{b.icon}</span>
                <span className={styles.benefitText}>{b.text}</span>
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            <button className={styles.primaryBtn}>Get started</button>
            <button className={styles.ghostBtn}>See if you&apos;re eligible</button>
          </div>

          <p className={styles.disclaimer}>
            *Members reported an average weight loss of 29.3 lbs in the first
            six months based on self-reported data from 111 members while on
            GLP-1 injections, combined with diet and exercise.
          </p>
        </div>

        {/* RIGHT: Visual + stat card */}
        <div className={styles.visual}>
          <div className={styles.imagePlaceholder}>
            <span className={styles.imageLabel}>Hero photo</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Average weight loss</span>
            <div className={styles.statValueRow}>
              <span className={styles.statValue}>29.3</span>
              <span className={styles.statUnit}>lbs</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} />
              <span className={styles.progressDot} />
            </div>
            <span className={styles.statFooter}>in 6 months</span>
          </div>
        </div>
      </div>
    </section>
  );
}
