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
    npi: "1235623372",
    imageSrc: "/images/johnathan-miller.webp",
  },
  {
    name: "Dr. Krasne",
    credential: "MD",
    affiliation: "Licensed physician",
    npi: "1306189832",
    imageSrc: "/images/dr-krasne .webp",
  },
  {
    name: "Dr. Niles",
    credential: "R.N., M.D., F.A.C.O.G",
    affiliation: "Board-certified physician",
    npi: "1922199470",
    imageSrc: "/images/Dr-vanessa-niles.webp",
  },
  {
    name: "Dr. Bugailiskis",
    credential: "MD",
    affiliation: "Board-certified physician",
    npi: "1871882035",
    imageSrc: "/images/cheryl-bugailiskis.webp",
  },
];

const COLUMN_RIGHT: Doctor[] = [
  {
    name: "Dr. Bugailiskis",
    credential: "MD",
    affiliation: "Board-certified physician",
    npi: "1871882035",
    imageSrc: "/images/cheryl-bugailiskis.webp",
  },
  {
    name: "Dr. Niles",
    credential: "R.N., M.D., F.A.C.O.G",
    affiliation: "Board-certified physician",
    npi: "1922199470",
    imageSrc: "/images/Dr-vanessa-niles.webp",
  },
  {
    name: "Dr. Krasne",
    credential: "MD",
    affiliation: "Licensed physician",
    npi: "1306189832",
    imageSrc: "/images/dr-krasne .webp",
  },
  {
    name: "Dr. Miller",
    credential: "MD",
    affiliation: "Licensed physician",
    npi: "1235623372",
    imageSrc: "/images/johnathan-miller.webp",
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

          <a
            href="/weightloss-onboard"
            className={styles.ctaButton}
            style={{ textDecoration: "none" }}
          >
            Meet My Doctor

          </a>

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
        <div className={styles.columns}>
          {/* Left column scrolls UP */}
          <div className={styles.columnWrap}>
            <div className={`${styles.columnTrack} ${styles.scrollUp}`}>
              {COLUMN_LEFT.map((doc, i) => (
                <DoctorCard key={`l-${i}`} doctor={doc} />
              ))}
              {COLUMN_LEFT.map((doc, i) => (
                <DoctorCard
                  key={`l-clone-${i}`}
                  doctor={doc}
                  ariaHidden
                />
              ))}
            </div>
          </div>

          {/* Right column scrolls DOWN */}
          <div className={styles.columnWrap}>
            <div className={`${styles.columnTrack} ${styles.scrollDown}`}>
              {COLUMN_RIGHT.map((doc, i) => (
                <DoctorCard key={`r-${i}`} doctor={doc} />
              ))}
              {COLUMN_RIGHT.map((doc, i) => (
                <DoctorCard
                  key={`r-clone-${i}`}
                  doctor={doc}
                  ariaHidden
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----- Sub-component ----- */

function DoctorCard({
  doctor,
  ariaHidden = false,
}: {
  doctor: Doctor;
  ariaHidden?: boolean;
}) {
  return (
    <article
      className={styles.doctorCard}
      aria-hidden={ariaHidden || undefined}
    >
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
        <a
          href={`https://npiregistry.cms.hhs.gov/provider-view/${doctor.npi}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.doctorNPI}
          aria-label={`Verify ${doctor.name} on the NPI registry (opens in new tab)`}
          tabIndex={ariaHidden ? -1 : undefined}
        >
          <span>NPI: {doctor.npi}</span>
          <span className={styles.npiArrow} aria-hidden="true">
            ↗
          </span>
        </a>
      </div>
    </article>
  );
}