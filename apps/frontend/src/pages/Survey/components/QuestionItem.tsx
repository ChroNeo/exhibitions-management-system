import { FaEdit } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import styles from "../CreateSurvey.module.css";
import { RatingPreview } from "./RatingPreview";

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
              className="toolBtn"
              aria-label="ยืนยันคำถาม"
              type="button"
            >
              <IoCheckmarkCircleOutline size={18} />
              ยืนยัน
            </button>
          ) : (
            <button
              onClick={onEdit}
              className="toolBtn"
              aria-label="แก้ไขคำถาม"
              type="button"
            >
              <FaEdit size={16} />
              แก้ไข
            </button>
          )}

          <button
            onClick={onDelete}
            className="toolBtn toolBtnDanger"
            aria-label="ลบคำถาม"
            type="button"
          >
            <FiTrash2 size={16} />
            ลบ
          </button>
        </div>
      </div>
    </div>
  );
}
