import {
  IoCreateOutline,
  IoTrashOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { RatingPreview } from "./RatingPreview";
import styles from "../CreateSurvey.module.css";

interface QuestionItemProps {
  id: string | number;
  topic: string;
  questionNumber: number;
  isEditing: boolean;
  onUpdateTopic: (value: string) => void;
  onConfirm: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function QuestionItem({
  id,
  topic,
  questionNumber,
  isEditing,
  onUpdateTopic,
  onConfirm,
  onEdit,
  onDelete,
}: QuestionItemProps) {
  return (
    <div className={styles.questionItem}>
      <div className={styles.inputGroup}>
        {isEditing ? (
          <input
            type="text"
            value={topic}
            onChange={(e) => onUpdateTopic(e.target.value)}
            placeholder="หัวข้อคำถาม"
            className={styles.input}
          />
        ) : (
          <h2 className={styles.topicHeading}>
            {questionNumber}. {topic}
          </h2>
        )}

        <RatingPreview questionId={id} />

        <div className={styles.buttonGroup}>
          {isEditing ? (
            <button
              onClick={onConfirm}
              className={styles.iconButtonOk}
              aria-label="ยืนยันคำถาม"
              type="button"
            >
              <IoCheckmarkCircleOutline size={20} />
            </button>
          ) : (
            <button
              onClick={onEdit}
              className={styles.iconButton}
              aria-label="แก้ไขคำถาม"
              type="button"
            >
              <IoCreateOutline size={20} />
            </button>
          )}

          <button
            onClick={onDelete}
            className={styles.iconButtonDelete}
            aria-label="ลบคำถาม"
            type="button"
          >
            <IoTrashOutline size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
