import type { KeyboardEvent, MouseEvent } from "react";
import styles from "./UnitExhibitionCard.module.css";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FaEdit } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";

export type UnitCardItem = {
  id: string;
  title: string;
  description?: string;
  posterUrl?: string;
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
  const handleClick = () => onSelect?.(item.id);
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

  const posterInitial = useMemo(() => {
    const trimmed = item.title.trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : "#";
  }, [item.title]);

  const hasActions = Boolean(onEdit || onDelete);

  return (
    <div
      className={styles.card}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={onSelect ? `เปิดดู ${item.title}` : undefined}
    >
      <div className={styles.media}>
        <div className={styles.posterWrap}>
          {item.posterUrl ? (
            <img
              src={item.posterUrl}
              alt={item.title}
              className={styles.poster}
              loading="lazy"
            />
          ) : (
            <div className={styles.posterFallback} aria-hidden="true">
              <span className={styles.posterInitial}>{posterInitial}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.contentInner}>
          <h3 className={styles.title}>{item.title}</h3>

          {item.description && (
            <p className={styles.desc}>{item.description}</p>
          )}
        </div>

        <div className={styles.footer}>
          <Link to={`/units/${item.id}`} className={styles.textLink}>
            รายละเอียดกิจกรรม &gt;
          </Link>
        </div>

        {hasActions && (
          <div className={styles.actions}>
            {onEdit && (
              <button
                className={`${styles.actionBtn} ${styles.edit}`}
                onClick={handleEditClick}
                title="แก้ไข"
                type="button"
              >
                 <FaEdit className={styles.icon} /> แก้ไข
              </button>
            )}
            {onDelete && (
              <button
                className={`${styles.actionBtn} ${styles.delete}`}
                onClick={handleDeleteClick}
                title="ลบ"
                type="button"
              >
                 <FiTrash2 className={styles.icon} /> ลบ
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
