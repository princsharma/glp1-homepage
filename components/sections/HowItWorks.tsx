import styles from "./HowItWorks.module.css";

const steps = [
  {
    number: "Step 1",
    title: "Get pre-approved online",
    caption: "with a 3 minute quiz",
    imageAlt: "Mobile app screen showing weight loss goal questions",
    imageSrc: "/how-it-works/step-1.jpg",
  },
  {
    number: "Step 2",
    title: "Meet with your US-based provider",
    caption: "to find your perfect treatment",
    imageAlt: "Healthcare provider in white coat",
    imageSrc: "/how-it-works/step-2.jpg",
  },
  {
    number: "Step 3",
    title: "Receive your prescription",
    caption: "with free 2-day shipping",
    imageAlt: "Hands receiving a delivery box",
    imageSrc: "/how-it-works/step-3.jpg",
  },
];

export default function HowItWorks() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Header row: title + CTA */}
        <header className={styles.header}>
          <h2 className={styles.heading}>
            Begin <span className={styles.headingAccent}>your journey</span>{" "}
            with us
          </h2>
          <button className={styles.ctaButton}>Get Started</button>
        </header>

        {/* Step cards */}
        <ol className={styles.stepGrid}>
          {steps.map((step) => (
            <li key={step.number} className={styles.stepCard}>
              <div className={styles.stepImageWrap}>
                <img
                  src={step.imageSrc}
                  alt={step.imageAlt}
                  className={styles.stepImage}
                />
              </div>

              <div className={styles.stepBody}>
                <span className={styles.stepBadge}>{step.number}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepCaption}>{step.caption}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}