import styles from "./ProductReviews.module.css";

type Review = {
  type: "text";
  name: string;
  rating: number;
  quote: string;
};

type ImageCard = {
  type: "image";
  imageSrc: string;
  alt: string;
};

type Card = Review | ImageCard;

const ROW_TOP: Card[] = [
  {
    type: "text",
    name: "Margaret",
    rating: 5,
    quote:
      "Absolutely wonderful and helpful. She walked me through everything and made me feel as if I really mattered. I was very pleased with our conversation.",
  },
  { type: "image", imageSrc: "/images/review-a.webp", alt: "Smiling man" },
  {
    type: "text",
    name: "Jamie",
    rating: 5,
    quote:
      "The questions are to the point and easy to navigate. I'm able to voice my concerns if needed and ask questions. They are quick to respond and keep me updated on my prescription.",
  },
  {
    type: "text",
    name: "Jacqueline",
    rating: 5,
    quote:
      "My experience is very positive. I am doing very well. Slowly and surely reaching my goals with their help. They have been very attentive and have provided me with all the resources to be successful. Thank you.",
  },
  {
    type: "text",
    name: "Diana",
    rating: 5,
    quote:
      "The staff has been so friendly and caring. I didn't expect that! If I call, I get an immediate answer from a real person!",
  },
  { type: "image", imageSrc: "/images/review-b.webp", alt: "Smiling woman" },
];

const ROW_BOTTOM: Card[] = [
  {
    type: "text",
    name: "Alexandra",
    rating: 5,
    quote:
      "Everything was quick and concise. I was treated professionally and given the opportunity to ask questions and have my questions answered thoroughly.",
  },
  {
    type: "text",
    name: "Greg",
    rating: 5,
    quote:
      "I was ready to give up. Wow. I would pay 10x as much if I had to. Dieting days are over. Thanks to the team for the metabolic fix — game changer.",
  },
  { type: "image", imageSrc: "/images/review-c.webp", alt: "Happy customer" },
  {
    type: "text",
    name: "Lou-Ann",
    rating: 5,
    quote:
      "The doctors and staff have been very professional and prompt with any questions I have and their support and care. I feel in great hands! I'm 13 lbs away from goal. Thank you!",
  },
  {
    type: "text",
    name: "Elizabeth",
    rating: 5,
    quote:
      "My clinician was kind, understanding of expectations, and future follow-ups are easy to understand and schedule.",
  },
  { type: "image", imageSrc: "/images/review-d.webp", alt: "Smiling person" },
];

export default function ProductReviews() {
  return (
    <section id="reviews" className={styles.section}>
      {/* Header */}
      <header className={styles.header}>
        <p className={styles.eyebrow}>THOSE WHO CHOSE US</p>
        <h2 className={styles.heading}>
          There&apos;s a reason people are{" "}
          <span className={styles.headingAccent}>raving about us</span>.
        </h2>
        <p className={styles.subcopy}>
          Join the multitude of people who have trusted us to help change their
          lives, achieving significant, lasting weight loss.
        </p>
      </header>

      {/* Two scrolling rows */}
      <div className={styles.rows} aria-hidden="true">
        {/* Top row — scrolls right-to-left */}
        <div className={styles.rowWrap}>
          <div className={`${styles.rowTrack} ${styles.scrollLeft}`}>
            {[...ROW_TOP, ...ROW_TOP].map((card, i) => (
              <ReviewCard key={`t-${i}`} card={card} />
            ))}
          </div>
        </div>

        {/* Bottom row — scrolls left-to-right */}
        <div className={styles.rowWrap}>
          <div className={`${styles.rowTrack} ${styles.scrollRight}`}>
            {[...ROW_BOTTOM, ...ROW_BOTTOM].map((card, i) => (
              <ReviewCard key={`b-${i}`} card={card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----- Sub-component ----- */

function ReviewCard({ card }: { card: Card }) {
  if (card.type === "image") {
    return (
      <article className={styles.imageCard}>
        <img src={card.imageSrc} alt={card.alt} className={styles.cardImage} />
      </article>
    );
  }

  return (
    <article className={styles.textCard}>
      <header className={styles.cardHeader}>
        <h3 className={styles.cardName}>{card.name}</h3>
        <div className={styles.stars} aria-label={`${card.rating} out of 5`}>
          {Array.from({ length: card.rating }).map((_, i) => (
            <span key={i} className={styles.star} aria-hidden="true">
              ★
            </span>
          ))}
        </div>
      </header>
      <p className={styles.cardQuote}>“{card.quote}”</p>
    </article>
  );
}