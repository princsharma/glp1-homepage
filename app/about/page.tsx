import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./About.module.css";

export const metadata = {
  title: "About Us — Ongo Weight Loss",
  description:
    "Doctor-led, science-backed GLP-1 weight loss care delivered through secure same-day telehealth visits.",
};

const HERO_STATS = [
  { value: "4,000+", label: "Patients Trust Ongo" },
  { value: "Same-Day", label: "Virtual Consultations" },
  { value: "FDA-Approved", label: "GLP-1 Medications" },
];

const CORE_PRINCIPLES = [
  "Detailed health evaluation by licensed doctors",
  "Continuous support and monitoring",
  "Backed by scientifically proven studies",
];

const WHY_CHOOSE = [
  {
    icon: "💻",
    title: "Convenience With Trusted Experts",
    body: "No waiting rooms, no generic plans, and no long hours. Connect with a licensed provider for a same-day virtual consultation, establishing the transparent patient–provider relationship required for prescribing.",
  },
  {
    icon: "💊",
    title: "Access to Six FDA-Approved GLP-1s",
    body: "If a licensed provider determines a GLP-1 medication is clinically appropriate for your condition, a prescription may be issued, allowing you to access treatment through a licensed pharmacy.",
  },
  {
    icon: "🌿",
    title: "Personalized Care Beyond Prescriptions",
    body: "We believe in a personalized approach. We offer weight-loss plans that combine GLP-1s, nutrition, lifestyle, and expert follow-ups.",
  },
  {
    icon: "📦",
    title: "Pharmacy-Handled Dispensing",
    body: "If prescribed, your medication is dispensed by a licensed U.S. pharmacy, which manages secure and timely shipping directly to your home.",
  },
  {
    icon: "🩺",
    title: "Evaluations From Weight Loss Specialists",
    body: "You are evaluated by a licensed professional with years of experience in obesity and overweight treatment. Each prescription is doctor-approved and based on your health condition.",
  },
  {
    icon: "🕑",
    title: "24/7 Reliable Customer Support",
    body: "The Ongo Weight Loss team is available around the clock to offer responsive support to our patients.",
  },
];

const STEPS = [
  {
    n: "Step 1",
    title: "Schedule a Free Visit",
    body: "A member of our care team connects with you to understand your health goals and medication preferences, including FDA-approved options and, when appropriate, compounded medications.",
  },
  {
    n: "Step 2",
    title: "Connect With a Licensed Doctor",
    body: "Speak with a licensed clinician who evaluates key factors like BMI, medical history, and health goals through a secure video or audio consultation.",
  },
  {
    n: "Step 3",
    title: "Receive a Prescription if Appropriate",
    body: "If clinically appropriate, your provider issues a prescription based on your personalized plan and guides you on next steps, including pharmacy options or home delivery coordination.",
  },
];

const VALUES = [
  {
    icon: "🤝",
    title: "Judgment Free Care",
    body: "Your body is unique, and we respect it. Our goal is to help you feel confident and supported as you reach your health goals.",
  },
  {
    icon: "📊",
    title: "Evidence-Based Outcomes",
    body: "Our team focuses on evidence-based treatment plans designed to support safe, sustainable weight loss.",
  },
  {
    icon: "🧬",
    title: "Led By Science",
    body: "Doctors thoroughly evaluate your health and use science-based decisions. They prescribe only FDA-approved medications.",
  },
  {
    icon: "💚",
    title: "Empathy With Expertise",
    body: "We offer more than medical solutions — we provide step-by-step guidance, constant tracking, and post-treatment support to help you achieve lasting results.",
  },
  {
    icon: "🔬",
    title: "Backed By Science",
    body: "All GLP-1 medications are tested for weight loss or type 2 diabetes. Licensed specialists guide you and monitor your progress.",
  },
];

const VALUE_BADGES = [
  { value: "100% FDA-Approved", label: "Medications for weight loss or type 2 diabetes" },
  { value: "Licensed", label: "Weight loss specialists" },
  { value: "Clinically Proven", label: "Treatment options" },
];

const DOCTORS = [
  {
    name: "Dr. Miller",
    credentials: "Licensed physician",
    image: "/images/johnathan-miller.webp",
    bio: "A licensed physician providing physician-guided weight loss and metabolic health consultations aligned with established clinical standards. Earned his medical degree from Columbia University with postgraduate training at Washington University in St. Louis.",
    npi: "1235623372",
  },
  {
    name: "Dr. Niles",
    credentials: "R.N., M.D., F.A.C.O.G. · Board-certified physician",
    image: "/images/Dr-vanessa-niles.webp",
    bio: "A licensed physician with over 30 years of clinical experience. Provides physician-guided weight loss consultations focused on individualized medical assessment and patient-centered care.",
    npi: "1922199470",
  },
  {
    name: "Dr. Krasne",
    credentials: "M.D. · Licensed physician",
    image: "/images/dr-krasne .webp",
    bio: "Board-certified and licensed, Dr. Krasne completed medical training at the University of Florida and the University of Miami Miller School of Medicine, with residency completed in 2017.",
    npi: "1306189832",
  },
  {
    name: "Dr. Bugailiskis",
    credentials: "MD · Board-certified physician",
    image: "/images/cheryl-bugailiskis.webp",
    bio: "A licensed physician focused on individualized treatment planning. Earned her medical degree from the University of Illinois at Chicago and evaluates patients based on their health history, goals, and clinical needs.",
    npi: "1871882035",
  },
];

const DELIVERY_BULLETS = [
  "Secure, pharmacy-managed delivery of medications",
  "No spillage, damage, or spoilage",
  "Inclusive of GLP-1 medication user guide",
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        {/* ============================================
            HERO
            ============================================ */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>ABOUT ONGO WEIGHT LOSS</p>
              <h1 className={styles.heading}>
                Transforming lives through{" "}
                <span className={styles.headingAccent}>
                  healthy weight management
                </span>
              </h1>
              <p className={styles.subcopy}>
                Ongo Weight Loss offers customized weight-loss programs based on
                your health profile. Our state-certified doctors assess your
                needs and prescribe FDA-approved medications to help you achieve
                safe, effective results.
              </p>
              <div className={styles.heroCtas}>
                <a href="/weightloss-onboard" className={styles.primaryBtn}>
                  Start My Free Evaluation →
                </a>
                <a href="/contact" className={styles.secondaryBtn}>
                  Talk to our team
                </a>
              </div>
            </div>

            <div className={styles.heroVisual} aria-hidden="true">
              <div className={styles.heroBlob} />
              <img
                src="/images/Gemini_Generated_Image_56dfmw56dfmw56df 1.png"
                alt=""
                className={styles.heroImage}
              />
            </div>
          </div>

          {/* Stats strip */}
          <div className={styles.statStrip}>
            {HERO_STATS.map((s) => (
              <div key={s.label} className={styles.statItem}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================
            MISSION
            ============================================ */}
        <section className={styles.section}>
          <div className={styles.sectionTwoCol}>
            <div className={styles.colCopy}>
              <p className={styles.eyebrow}>OUR MISSION</p>
              <h2 className={styles.sectionHeading}>
                Healthier lives,{" "}
                <span className={styles.headingAccent}>
                  effective weight loss solutions
                </span>
              </h2>
              <p className={styles.sectionLead}>
                Our mission is to make your weight loss journey simple and
                achievable. We create personalized plans tailored to your health
                needs. Through virtual consultations, our licensed doctors guide
                you every step of the way.
              </p>
            </div>

            <div className={styles.principlesCard}>
              <span className={styles.principlesLabel}>Our core principles</span>
              <ul className={styles.principlesList}>
                {CORE_PRINCIPLES.map((p) => (
                  <li key={p} className={styles.principleItem}>
                    <span className={styles.principleCheck} aria-hidden="true">
                      ✓
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ============================================
            FOUNDER QUOTE
            ============================================ */}
        <section className={styles.founderSection}>
          <div className={styles.founderInner}>
            <p className={styles.eyebrow}>A MESSAGE FROM OUR FOUNDER</p>
            <h2 className={styles.sectionHeading}>
              The problem that{" "}
              <span className={styles.headingAccent}>sparked our idea</span>
            </h2>

            <blockquote className={styles.quote}>
              <span className={styles.quoteMark} aria-hidden="true">
                “
              </span>
              <p>
                For many years, there was a gap between healthcare services and
                real patient needs. People waited long hours to see a doctor,
                while others struggled just to get to the clinic.
              </p>
              <p>
                Patients told us they avoided going out or socializing due to
                low confidence, mobility issues, or fear of being judged — which
                made it even harder to seek the care they truly needed.
              </p>
              <p>
                We started Ongo to act as a bridge between patients and doctors,
                offering a virtual platform where you can achieve your
                weight-loss goals comfortably at home. Our mission is to expand
                access to safe, evidence-based obesity care through secure,
                same-day telehealth visits with licensed medical professionals.
              </p>
              <p>
                We offer expert guidance and science-backed solutions tailored
                to your unique health needs.
              </p>
            </blockquote>

            <div className={styles.signature}>
              <span className={styles.avatar} aria-hidden="true">
                DS
              </span>
              <div>
                <p className={styles.founderName}>Deep Chand Sharma</p>
                <p className={styles.founderTitle}>
                  Founder &amp; CEO, Ongo Weight Loss
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            WHY CHOOSE US
            ============================================ */}
        <section className={styles.section}>
          <div className={styles.sectionContainer}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>WHY ONGO</p>
              <h2 className={styles.sectionHeading}>
                Why thousands choose{" "}
                <span className={styles.headingAccent}>Ongo Weight Loss</span>
              </h2>
              <p className={styles.sectionLead}>
                Why wait in a crowded hall? Consult your doctor digitally. With
                our pioneering approach, healthcare is convenient — and care is
                personalized to support long-term, healthier habits.
              </p>
            </header>

            <div className={styles.cardGrid}>
              {WHY_CHOOSE.map((c) => (
                <article key={c.title} className={styles.featureCard}>
                  <span className={styles.featureIcon} aria-hidden="true">
                    {c.icon}
                  </span>
                  <h3 className={styles.featureTitle}>{c.title}</h3>
                  <p className={styles.featureBody}>{c.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================
            STEPS
            ============================================ */}
        <section className={styles.stepsSection}>
          <div className={styles.sectionContainer}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>HOW IT WORKS</p>
              <h2 className={styles.sectionHeading}>
                Steps to your{" "}
                <span className={styles.headingAccent}>weight loss journey</span>
              </h2>
            </header>

            <ol className={styles.stepsGrid}>
              {STEPS.map((s, i) => (
                <li key={s.title} className={styles.stepCard}>
                  <span className={styles.stepBadge}>{s.n}</span>
                  <span className={styles.stepNumber} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepBody}>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ============================================
            CORE VALUES
            ============================================ */}
        <section className={styles.section}>
          <div className={styles.sectionContainer}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>OUR CORE VALUES</p>
              <h2 className={styles.sectionHeading}>
                Science meets a{" "}
                <span className={styles.headingAccent}>patient-first approach</span>
              </h2>
              <p className={styles.sectionLead}>
                We blend medical rigor with empathy to deliver a pioneering
                patient experience.
              </p>
            </header>

            <div className={styles.valuesGrid}>
              {VALUES.map((v) => (
                <article key={v.title} className={styles.valueCard}>
                  <span className={styles.valueIcon} aria-hidden="true">
                    {v.icon}
                  </span>
                  <h3 className={styles.valueTitle}>{v.title}</h3>
                  <p className={styles.valueBody}>{v.body}</p>
                </article>
              ))}
            </div>

            <div className={styles.badgeStrip}>
              {VALUE_BADGES.map((b) => (
                <div key={b.value} className={styles.badgeItem}>
                  <span className={styles.badgeValue}>{b.value}</span>
                  <span className={styles.badgeLabel}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================
            DOCTORS
            ============================================ */}
        <section className={styles.doctorsSection}>
          <div className={styles.sectionContainer}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>OUR CLINICIANS</p>
              <h2 className={styles.sectionHeading}>
                The expertise{" "}
                <span className={styles.headingAccent}>behind our care</span>
              </h2>
              <p className={styles.sectionLead}>
                U.S. board-certified clinicians with interdisciplinary expertise
                and years of experience — invested in the best patient outcomes.
              </p>
            </header>

            <div className={styles.doctorsGrid}>
              {DOCTORS.map((d) => (
                <article key={d.name} className={styles.doctorCard}>
                  <div className={styles.doctorPhotoWrap}>
                    <img
                      src={d.image}
                      alt={`Portrait of ${d.name}`}
                      className={styles.doctorPhoto}
                    />
                  </div>
                  <div className={styles.doctorHeader}>
                    <h3 className={styles.doctorName}>{d.name}</h3>
                    <p className={styles.doctorCredentials}>{d.credentials}</p>
                  </div>
                  <p className={styles.doctorBio}>{d.bio}</p>
                  <a
                    href={`https://npiregistry.cms.hhs.gov/provider-view/${d.npi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.npiLink}
                    aria-label={`Verify ${d.name} on the NPI registry (opens in new tab)`}
                  >
                    <span className={styles.npiBadge} aria-hidden="true">
                      NPI
                    </span>
                    <span className={styles.npiNumber}>{d.npi}</span>
                    <span className={styles.npiArrow} aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </article>
              ))}
            </div>

            <div className={styles.doctorsCta}>
              <a href="/weightloss-onboard" className={styles.primaryBtn}>
                Book your free consultation →
              </a>
            </div>
          </div>
        </section>

        {/* ============================================
            DELIVERY
            ============================================ */}
        <section className={styles.section}>
          <div className={styles.deliveryInner}>
            <div className={styles.deliveryVisual}>
              <img
                src="/images/glp-d.webp"
                alt="GLP-1 medications delivered to your doorstep"
                className={styles.deliveryImage}
              />
            </div>

            <div className={styles.deliveryCopy}>
              <p className={styles.eyebrow}>DELIVERY</p>
              <h2 className={styles.sectionHeading}>
                GLP-1 medications{" "}
                <span className={styles.headingAccent}>to your doorstep</span>
              </h2>
              <p className={styles.sectionLead}>
                Once approved, your prescription is sent to a licensed U.S.
                pharmacy. Your FDA-approved GLP-1 medications are shipped to
                your doorstep in 3 to 5 business days.
              </p>
              <ul className={styles.deliveryList}>
                {DELIVERY_BULLETS.map((b) => (
                  <li key={b} className={styles.deliveryItem}>
                    <span className={styles.deliveryCheck} aria-hidden="true">
                      ✓
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <a href="/weightloss-onboard" className={styles.primaryBtn}>
                Get started →
              </a>
            </div>
          </div>
        </section>

        {/* ============================================
            CLOSING CTA
            ============================================ */}
        <section className={styles.ctaBanner}>
          <div className={styles.ctaBannerInner}>
            <p className={styles.ctaEyebrow}>YOUR TRUSTED FITNESS PARTNER</p>
            <h2 className={styles.ctaHeading}>
              Connect with us and join{" "}
              <span className={styles.ctaHeadingAccent}>thousands of patients</span>
            </h2>
            <p className={styles.ctaCopy}>
              Embrace your fitness journey with Ongo Weight Loss. Guided by
              licensed providers, step into a healthier and more confident you —
              on a HIPAA-compliant platform aligned with federal and state
              telehealth regulations.
            </p>
            <div className={styles.ctaButtons}>
              <a href="/weightloss-onboard" className={styles.ctaPrimary}>
                Schedule Consultation →
              </a>
              <a href="/contact" className={styles.ctaSecondary}>
                Contact our team
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
