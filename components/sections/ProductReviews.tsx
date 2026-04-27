import styles from "./ProductReviews.module.css";

const reviews = [
  { name: "Reviewer One", text: "Testimonial placeholder text goes here." },
  { name: "Reviewer Two", text: "Testimonial placeholder text goes here." },
  { name: "Reviewer Three", text: "Testimonial placeholder text goes here." },
];

export default function ProductReviews() {
  return (
    <section
      id="reviews"
      className="w-full flex items-center justify-center px-6 py-20"
    >
      <div className="max-w-6xl w-full flex flex-col gap-12">
        <div className="flex flex-col items-center text-center gap-3">
          <h2 className={styles.heading}>Product Reviews</h2>
          <p className={styles.subheading}>
            Social proof — real people, real results, real trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.name} className={styles.reviewCard}>
              <p className={styles.reviewText}>“{r.text}”</p>
              <span className={styles.reviewer}>— {r.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
