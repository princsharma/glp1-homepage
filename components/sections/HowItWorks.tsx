import styles from "./HowItWorks.module.css";

const steps = [
  {
    number: "Step 1",
    title: "Start with a Free Intake Call",
    caption: "Discuss your medication preferences",
    imageAlt: "Mobile app screen showing weight loss goal questions",
    imageSrc: "/images/step-a.webp",
  },
  {
    number: "Step 2",
    title: "Consult with a Licensed Doctor",
    caption: "Determine your eligibility",
    imageAlt: "Healthcare provider in white coat",
    imageSrc: "/images/step-b.webp",
  },
  {
    number: "Step 3",
    title: "Receive a Personalized Treatment Plan",
    caption: "If appropriate, start your treatment",
    imageAlt: "Hands receiving a delivery box",
    imageSrc: "/images/step-c.webp",
  },
];

export default function HowItWorks() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Header row: title + CTA */}
        <header className={styles.header}>
          <h2 className={styles.heading}>
           How your treatment <span className={styles.headingAccent}>journey works</span>{" "}
          
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