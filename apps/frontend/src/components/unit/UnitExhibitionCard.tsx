import type { KeyboardEvent, MouseEvent } from "react";
import styles from "./UnitExhibitionCard.module.css";

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
};

export default function UnitExhibitionCard({ item, onSelect, onEdit }: Props) {
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
          <button type="button" className={styles.editBtn} onClick={handleEditClick}>
            แก้ไข
          </button>
        )}
      </div>
    </div>
  );
}
