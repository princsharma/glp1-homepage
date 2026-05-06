import styles from "./AppMobileCTA.module.css";

export default function AppMobileCTA() {
  return (
    <section className={styles.section}>
      <div className={styles.canvas}>
        {/* Abstract decorative shapes in background */}
        <svg
          className={styles.decorShapes}
          viewBox="0 0 1200 500"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {/* Big rounded petal — center */}
          <path
            d="M 400,-50 Q 600,150 500,400 Q 350,550 200,400 Q 100,200 400,-50 Z"
            fill="var(--color-warm-soft)"
            opacity="0.45"
          />
          {/* Smaller petal — right */}
          <path
            d="M 1100,100 Q 1300,250 1150,450 Q 1000,500 950,350 Q 950,150 1100,100 Z"
            fill="var(--color-warm-soft)"
            opacity="0.4"
          />
          {/* Soft circle — top */}
          <circle
            cx="850"
            cy="60"
            r="120"
            fill="var(--color-warm-soft)"
            opacity="0.3"
          />
        </svg>
 <div className={styles.canvas_inner}>
        {/* Content */}
        <div className={styles.content}>
          <h2 className={styles.heading}>
           Be in charge of
            <br />
            <span className={styles.headingItalic}>your health!</span>
          </h2>

          <p className={styles.subcopy}>
          Start your evaluation today for GLP-1 treatments tailored to sustainable weight loss.
          </p>

          <button className={styles.ctaButton}>Get Started</button>
        </div>

        {/* Hero image — bleeds right */}
        <div className={styles.imageWrap}>
          <img
            src="/images/ORANGE GIRL.png"
            alt="Smiling person enjoying a confident moment"
            className={styles.heroImage}
          />
        </div>
        </div>
      </div>
    </section>
  );
}