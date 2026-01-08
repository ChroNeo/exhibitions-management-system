import { MdEdit, MdDelete, MdCheck } from "react-icons/md";
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
            placeholder="Topic"
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
            <button onClick={onConfirm} className={styles.iconButtonOk}>
              <MdCheck size={20} />
            </button>
          ) : (
            <button onClick={onEdit} className={styles.iconButton}>
              <MdEdit size={20} />
            </button>
          )}
          <button onClick={onDelete} className={styles.iconButtonDelete}>
            <MdDelete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
