import { FaEdit, FaClipboardList } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import styles from "./DetailActions.module.css";
export default function DetailActions({
  show,
  onEdit,
  onDelete,
  onManageSurveys,
}: {
  show?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onManageSurveys?: () => void;
}) {
  if (!show) return null;

  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={`${styles.btn} ${styles.edit}`}
        onClick={onEdit}
        disabled={!onEdit}
      >
        <FaEdit className={styles.icon} />
        <span>แก้ไข</span>
      </button>

      {onManageSurveys && (
        <button
          type="button"
          className={`${styles.btn} ${styles.survey}`}
          onClick={onManageSurveys}
        >
          <FaClipboardList className={styles.icon} />
          <span>จัดการแบบสอบถาม</span>
        </button>
      )}

      <button
        type="button"
        className={`${styles.btn} ${styles.delete}`}
        onClick={onDelete}
        disabled={!onDelete}
      >
        <FiTrash2 className={styles.icon} />
        <span>ลบ</span>
      </button>
    </div>
  );
}
