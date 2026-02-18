import styles from "../CreateSurvey.module.css";

interface RatingPreviewProps {
  questionId: string | number;
}

export function RatingPreview({ questionId }: RatingPreviewProps) {
  return (
    <div className={styles.ratingPreview} aria-label="ตัวอย่างคะแนน 1 ถึง 5">
      {[1, 2, 3, 4, 5].map((rating) => (
        <label key={rating} className={styles.ratingPill} aria-disabled="true">
          <input
            type="radio"
            name={`preview-${questionId}`}
            value={rating}
            disabled
            className={styles.ratingInput}
            tabIndex={-1}
          />
          <span className={styles.ratingValue}>{rating}</span>
        </label>
      ))}
    </div>
  );
}
