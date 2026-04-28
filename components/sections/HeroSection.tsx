import styles from "./HeroSection.module.css";

const marqueeImages = [
  "/images/glp-a.jpg",
  "/images/glp-b.jpg",
  "/images/glp-c.jpg",
  "/images/glp-d.png",
  "/images/glp-c.jpg",
];

export default function Herosection() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>
          JOIN <span className={styles.eyebrowHighlight}>100,000+</span>{" "}
          PATIENTS WHO HAVE STARTED THEIR GLP-1 JOURNEY
        </p>

        <h1 className={styles.heading}>
          Weight loss made easy with{" "}
          <span className={styles.headingItalic}>a prescription</span> for
          GLP-1&apos;s
        </h1> 

        <ul className={styles.benefits}>
          <li className={styles.benefitItem}>
            <span className={styles.benefitCheck}>✓</span>
            Lose up to 24% of your body weight
          </li>
          <li className={styles.benefitItem}>
            <span className={styles.benefitCheck}>✓</span>
            Stop junk food cravings in their tracks
          </li>
          <li className={styles.benefitItem}>
            <span className={styles.benefitCheck}>✓</span>
            No waiting rooms or pharmacy lines
          </li>
        </ul>

        <button className={styles.ctaButton}>Get Started</button>
      </div>

      <div className={styles.marquee}>
        <div className={styles.marqueeTrack}>
          {/* Render twice for seamless infinite loop */}
          {[...marqueeImages, ...marqueeImages].map((src, i) => (
            <div key={i} className={styles.marqueeItem}>
              <img src={src} alt="" className={styles.marqueeImage} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}