import { FaEdit } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import styles from "./DetailActions.module.css";

export default function DetailActions({
  show,
  onEdit,
  onDelete,
}: {
  show?: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  if (!show) return null;

  return (
    <div className={styles.actions}>
      <button className={`${styles.btn} ${styles.edit}`} onClick={onEdit}>
        <FaEdit className={styles.icon} />
        <span>แก้ไข</span>
      </button>

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
