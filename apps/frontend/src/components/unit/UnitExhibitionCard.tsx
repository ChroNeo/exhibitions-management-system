import type { KeyboardEvent, MouseEvent } from "react";
import styles from "./UnitExhibitionCard.module.css";
import { Edit2, Trash2 } from "lucide-react";

export type UnitCardItem = {
  id: string;
  title: string;
  dateText?: string;
  typeLabel?: string;
  location?: string;
  description?: string;
};

type Props = {
  item: UnitCardItem;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export default function UnitExhibitionCard({
  item,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  const handleClick = () => {
    onSelect?.(item.id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(item.id);
    }
  };

  const handleEditClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onEdit?.(item.id);
  };
  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete?.(item.id);
  };
  const metaLines = [item.dateText, item.typeLabel, item.location].filter(
    (text): text is string => Boolean(text)
  );

  return (
    <div
      className={styles.card}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <h3 className={styles.title}>{item.title}</h3>
      {metaLines.length > 0 && (
        <div className={styles.meta}>
          {metaLines.map((text, index) => (
            <span key={`${item.id}-${index}`}>{text}</span>
          ))}
        </div>
      )}
      {item.description && (
        <p className={styles.description}>{item.description}</p>
      )}
      <div className={styles.footer}>
        <span>คลิกเพื่อดูรายละเอียด</span>
        {onEdit && (
          <button
            className={styles.actionBtn}
            onClick={handleEditClick}
            title="แก้ไข"
            type="button"
          >
            <Edit2 size={16} /> แก้ไข
          </button>
        )}
        {onDelete && (
          <button
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            onClick={handleDeleteClick}
            title="ลบ"
            type="button"
          >
            <Trash2 size={16} /> ลบ
          </button>
        )}
      </div>
    </div>
  );
}
