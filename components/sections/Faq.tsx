"use client";

import { useState } from "react";
import styles from "./Faq.module.css";

type FaqItem = {
  question: string;
  answer: string;
};

const FAQS: FaqItem[] = [
  {
    question: "What is GLP-1 and how does it help with weight loss?",
    answer:
      "GLP-1 (Glucagon-Like Peptide-1) is a hormone naturally produced in your gut that helps regulate appetite, slow digestion, and improve blood sugar levels. GLP-1 medications mimic this hormone, helping you feel fuller longer and reducing cravings — a powerful tool for sustainable weight loss when combined with lifestyle changes.",
  },
  {
    question: "Am I eligible for the program?",
    answer:
      "Eligibility is determined by a licensed healthcare provider after reviewing your medical history, current medications, and BMI. Generally, candidates have a BMI of 27 or higher with weight-related health conditions, or a BMI of 30+. Use our BMI calculator above to get a quick initial assessment.",
  },
  {
    question: "How quickly will I see results?",
    answer:
      "Most members begin noticing reduced cravings within the first 1–2 weeks. Significant weight loss typically becomes visible by week 4–6, with members reporting an average weight loss of 29.3 lbs in the first six months when combined with diet and exercise.",
  },
  {
    question: "Are there any side effects I should know about?",
    answer:
      "Common side effects include mild nausea, fatigue, and digestive changes — usually resolving within the first few weeks. More serious side effects are rare but possible. Your provider will discuss your full medical history and monitor you throughout the program. Important safety information is available during consultation.",
  },
  {
    question: "How much does the program cost?",
    answer:
      "Pricing varies based on the medication and treatment plan recommended for you. Many plans are FSA & HSA eligible, and we accept most major insurance providers. After your consultation, you'll receive a transparent breakdown with no hidden fees.",
  },
  {
    question: "Can I cancel my membership anytime?",
    answer:
      "Yes — there are no long-term contracts. You can pause or cancel your membership at any time. We recommend speaking with your provider before stopping medication to ensure a safe transition plan.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* LEFT — copy + contact card */}
        <aside className={styles.left}>
          <p className={styles.eyebrow}>QUESTIONS · ANSWERS</p>

          <h2 className={styles.heading}>
            Your{" "}
            <span className={styles.headingAccent}>frequently asked</span>{" "}
            questions, answered.
          </h2>

          <p className={styles.subcopy}>
            Everything you need to know about our GLP-1 program. Can&apos;t
            find the answer you&apos;re looking for? Our care team is here to
            help.
          </p>

          {/* Contact card */}
          <div className={styles.contactCard}>
            <span className={styles.contactBadge}>
              <span className={styles.contactDot} />
              Live support
            </span>
            <h3 className={styles.contactTitle}>Still have questions?</h3>
            <p className={styles.contactText}>
              Talk to a real person — no waiting rooms, no phone trees.
            </p>
            <button className={styles.contactButton}>
              Talk to our team →
            </button>
          </div>
        </aside>

        {/* RIGHT — accordion */}
        <div className={styles.accordion}>
          {FAQS.map((faq, i) => {
            const isOpen = i === openIndex;
            return (
              <article
                key={i}
                className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}
              >
                <button
                  type="button"
                  className={styles.itemTrigger}
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                >
                  <span className={styles.itemQuestion}>
                    {isOpen && <span className={styles.activeDot} />}
                    {faq.question}
                  </span>
                  <span
                    className={styles.itemIcon}
                    aria-hidden="true"
                  >
                    <span className={styles.iconBar} />
                    <span
                      className={`${styles.iconBar} ${styles.iconBarVertical}`}
                    />
                  </span>
                </button>

                <div
                  id={`faq-panel-${i}`}
                  className={styles.itemPanel}
                  role="region"
                >
                  <div className={styles.itemAnswer}>{faq.answer}</div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}