import styles from "../CreateSurvey.module.css";

interface RatingPreviewProps {
  questionId: string | number;
}

export function RatingPreview({ questionId }: RatingPreviewProps) {
  return (
    <div className={styles.ratingContainer}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <label key={rating} className={styles.ratingOption}>
          <input
            type="radio"
            name={`question-${questionId}`}
            value={rating}
            disabled
            className={styles.radioInput}
          />
          <span className={styles.ratingLabel}>{rating}</span>
        </label>
      ))}
    </div>
  );
}
