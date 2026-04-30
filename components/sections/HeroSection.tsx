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
          JOIN <span className={styles.eyebrowHighlight}>5,000+</span>{" "}
          PATIENTS WHO HAVE STARTED THEIR GLP-1 JOURNEY
        </p>

        <h1 className={styles.heading}>
          Weight loss program rooted in {" "}
          <span className={styles.headingItalic}>science,</span>
          not trends
        </h1> 

        <ul className={styles.benefits}>
          <li className={styles.benefitItem}>
            <span className={styles.benefitCheck}>✓</span>
           Board-certified Physicians
          </li>
          <li className={styles.benefitItem}>
            <span className={styles.benefitCheck}>✓</span>
           HIPAA Compliant Platform

          </li>
          <li className={styles.benefitItem}>
            <span className={styles.benefitCheck}>✓</span>
           100% Online Consultations
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