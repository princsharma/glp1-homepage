import styles from "./OngoSolution.module.css";

type Doctor = {
  name: string;
  credential: string;
  affiliation: string;
 npi: string;
  imageSrc: string;
};

const COLUMN_LEFT: Doctor[] = [
  {
    name: "Dr. Miller",
    credential: "MD",
    affiliation: "Licensed physician",
    npi: "NPI: 1235623372",

    imageSrc: "/images/johnathan-miller.webp",
  },
  {
    name: "Dr. Krasne",
    credential: "MD",
    affiliation: "Licensed physician",
    npi: "NPI: 1306189832",
    imageSrc: "/images/dr-krasne .webp",
  },
 
];

const COLUMN_RIGHT: Doctor[] = [
 {
    name: "Dr. Niles",
    credential: "R.N., M.D., F.A.C.O.G",
    affiliation: "Board-certified physician",
    npi: "NPI: 1922199470",

    imageSrc: "/images/Dr-vanessa-niles.webp",
  },
  {
    name: "Dr. Bugailiskis",
    credential: "MD",
    affiliation: "Board-certified physician",
    npi: "NPI: 1871882035",

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
           We connect you with licensed doctors who guide you toward healthy and sustainable weight loss.

          </p>

          <button className={styles.ctaButton}>Get Started</button>

          {/* Trust strip */}
          <div className={styles.trustStrip}>
            <div className={styles.trustItem}>
              <span className={styles.trustValue}>30+</span>
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
        <p className={styles.doctorNPI}>{doctor.npi}</p>
      </div>
    </article>
  );
}