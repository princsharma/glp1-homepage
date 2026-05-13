"use client";

import { useState } from "react";
import styles from "./Faq.module.css";

type FaqItem = {
  question: string;
  answer: string;
};

const FAQS: FaqItem[] = [
  {
    question: "What are GLP-1 medications and how do they help with weight loss?",
    answer:
      "GLP-1 medications are prescription drugs that help control blood sugar and reduce appetite. They work by mimicking a natural hormone that signals fullness, making it easier to eat less and lose weight over time.",
  },
  {
    question: "What’s the difference between GLP-1 and other weight loss medications?",
    answer:
      "GLP-1 medications focus on regulating appetite and blood sugar, unlike many weight loss pills that act as stimulants or suppressants. They are given by injection and are often more effective for long-term results.",
  },
  {
    question: "Who should consider taking GLP-1 medications for weight management?",
    answer:
      "GLP-1 medications are meant for adults with obesity or those who are overweight with weight-related health conditions like type 2 diabetes, high blood pressure, or high cholesterol.",
  },
  {
    question: "What are the common side effects of GLP-1 medications?",
    answer:
      "Some common side effects include nausea, mild stomach upset, and occasional fatigue. These usually fade over time as your body adjusts.",
  },
  {
    question: "Do GLP-1 medications require a prescription from a doctor?",
    answer:
      "Yes, GLP-1 medications are prescription-based. A licensed healthcare provider needs to evaluate your health and determine if they are right for you.",
  },
  {
    question: "How much does the Ongo Weight Loss program cost?",
    answer:
      "The evaluation fee for our program is $69. Medication costs are additional based on the type, dose, and treatment plan.",
  },
  {
    question: "Can I cancel my membership anytime?",
    answer:
      "Yes. You can pause or cancel your membership before the next billing cycle. We recommend speaking with your provider before stopping medication to ensure a safe transition plan.",
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
             Care Team Support
            </span>
            <h3 className={styles.contactTitle}>Still have questions?</h3>
            <p className={styles.contactText}>
             Talk to a care team member to get a better understanding of your treatment.
            </p>
            <button className={styles.contactButton}>
             Start My Free Call →
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