import styles from "./ExhibitionCard.module.css";
import { Edit2, Trash2 } from "lucide-react";
import type { KeyboardEvent, MouseEvent } from "react";
import { MdOutlineCalendarToday } from "react-icons/md";
import { LuClock } from "react-icons/lu";
import { IoLocationOutline } from "react-icons/io5";
import type { Exhibition } from "./../../types/exhibition";
import { toFileUrl } from "../../utils/url";

const FALLBACK_POSTER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"%3E%3Crect width="120" height="120" rx="16" fill="%23E5E7EB"/%3E%3Cpath d="M30 82l18-22 14 16 10-12 18 20H30z" fill="%23CBD5F5"/%3E%3Ccircle cx="76" cy="44" r="10" fill="%239CA3AF"/%3E%3Ctext x="60" y="70" text-anchor="middle" font-size="10" fill="%236B7280"%3ENo Image%3C/text%3E%3C/svg%3E';

export default function ExhibitionCard({
  item,
  onEdit,
  onDelete,
  onSelect,
}: {
  item: Exhibition;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSelect?: (id: string) => void;
}) {
  const handleCardClick = () => onSelect?.(item.id);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(item.id);
    }
  };

  const coverSrc = toFileUrl(item.coverUrl) || FALLBACK_POSTER;
  const [datePart, timePart] = item.dateText
    .split("|")
    .map((part) => part.trim());
  const hasActions = Boolean(onEdit || onDelete);

  const handleEditClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onEdit?.(item.id);
  };

  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete?.(item.id);
  };

  return (
    <div
      className={styles.card}
      onClick={handleCardClick}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-label={onSelect ? `เปิดดู ${item.title}` : undefined}
    >
      <div className={styles.inner}>
        <img
          src={coverSrc}
          alt={item.title}
          className={styles.cover}
          loading="lazy"
          onError={(e) => {
            if (e.currentTarget.src === FALLBACK_POSTER) return;
            e.currentTarget.src = FALLBACK_POSTER;
          }}
        />

        <div className={styles.content}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{item.title}</h3>
            {item.isPinned && <span className={styles.pin} aria-label="ปักหมุด" />}
          </div>

          <div className={styles.metaGroup}>
            {datePart && (
              <div className={styles.metaRow}>
                <MdOutlineCalendarToday className={styles.metaIcon} />
                <span>{datePart}</span>
              </div>
            )}

            {timePart && (
              <div className={styles.metaRow}>
                <LuClock className={styles.metaIcon} />
                <span>{timePart}</span>
              </div>
            )}

            {item.location && (
              <div className={styles.metaRow}>
                <IoLocationOutline className={styles.metaIcon} />
                <span>{item.location}</span>
              </div>
            )}
          </div>

          {item.description && <p className={styles.desc}>{item.description}</p>}
        </div>

        {hasActions && (
          <div className={styles.actions}>
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
        )}
      </div>
    </div>
  );
}
