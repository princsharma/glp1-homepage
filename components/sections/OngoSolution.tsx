import styles from "./OngoSolution.module.css";

type Doctor = {
  name: string;
  credential: string;
  affiliation: string;
  imageSrc: string;
};

const COLUMN_LEFT: Doctor[] = [
  {
    name: "Daniel Funsch",
    credential: "MD",
    affiliation: "American Board of Emergency Medicine",
    imageSrc: "/images/johnathan-miller.webp",
  },
  {
    name: "Kimberli Hastings",
    credential: "NP",
    affiliation: "American Academy of Nurse Practitioners",
    imageSrc: "/images/dr-krasne .webp",
  },
 
];

const COLUMN_RIGHT: Doctor[] = [
 {
    name: "Marcus Reed",
    credential: "MD",
    affiliation: "American Board of Internal Medicine",
    imageSrc: "/images/Dr-vanessa-niles.webp",
  },
  {
    name: "Priya Shah",
    credential: "NP",
    affiliation: "American Academy of Nurse Practitioners",
    imageSrc: "/images/cheryl-bugailiskis.webp",
  },
];

export default function ongoSolution() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* LEFT — copy */}
        <div className={styles.copy}>
          <h2 className={styles.heading}>
            Meet our{" "}
            <span className={styles.headingAccent}>Dedicated Doctors</span>
          </h2>

          <p className={styles.subcopy}>
            Talk to our team for advice on eating healthy, staying fit, and
            keeping your confidence while you lose weight. Restore your health
            with a little help from our devoted team.
          </p>

          <button className={styles.ctaButton}>Get Started</button>

          {/* Trust strip */}
          <div className={styles.trustStrip}>
            <div className={styles.trustItem}>
              <span className={styles.trustValue}>200+</span>
              <span className={styles.trustLabel}>Licensed providers</span>
            </div>
            <div className={styles.trustDivider} />
            <div className={styles.trustItem}>
              <span className={styles.trustValue}>50</span>
              <span className={styles.trustLabel}>States covered</span>
            </div>
          </div>
        </div>

        {/* RIGHT — scrolling columns */}
        <div className={styles.columns} aria-hidden="true">
          {/* Left column scrolls UP */}
          <div className={styles.columnWrap}>
            <div className={`${styles.columnTrack} ${styles.scrollUp}`}>
              {[...COLUMN_LEFT, ...COLUMN_LEFT].map((doc, i) => (
                <DoctorCard key={`l-${i}`} doctor={doc} />
              ))}
            </div>
          </div>

          {/* Right column scrolls DOWN */}
          <div className={styles.columnWrap}>
            <div className={`${styles.columnTrack} ${styles.scrollDown}`}>
              {[...COLUMN_RIGHT, ...COLUMN_RIGHT].map((doc, i) => (
                <DoctorCard key={`r-${i}`} doctor={doc} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----- Sub-component ----- */

function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <article className={styles.doctorCard}>
      <div className={styles.doctorImageWrap}>
        <img
          src={doctor.imageSrc}
          alt={`${doctor.name}, ${doctor.credential}`}
          className={styles.doctorImage}
        />
      </div>

      <div className={styles.doctorInfo}>
        <h3 className={styles.doctorName}>
          {doctor.name}, {doctor.credential}
          <span className={styles.verifiedBadge} aria-label="Verified provider">
            ✓
          </span>
        </h3>
        <p className={styles.doctorAffiliation}>{doctor.affiliation}</p>
      </div>
    </article>
  );
}