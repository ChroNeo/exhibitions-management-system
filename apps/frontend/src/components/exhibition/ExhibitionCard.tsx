import styles from "./ExhibitionCard.module.css";
import { Edit2, Trash2 } from "lucide-react";
import {
  useEffect,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { MdOutlineCalendarToday } from "react-icons/md";
import { LuClock } from "react-icons/lu";
import { IoLocationOutline } from "react-icons/io5";
import type { Exhibition } from "./../../types/exhibition";
import { toFileUrl } from "../../utils/url";
import { toThaiDate, toThaiTimeRange } from "../../utils/dateFormat";

const FALLBACK_POSTER = "https://placehold.co/1920x1080";

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
  const [posterSrc, setPosterSrc] = useState(
    () => toFileUrl(item.coverUrl) || FALLBACK_POSTER
  );

  useEffect(() => {
    setPosterSrc(toFileUrl(item.coverUrl) || FALLBACK_POSTER);
  }, [item.coverUrl]);

  const handleCardClick = () => onSelect?.(item.id);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(item.id);
    }
  };

  const toISO = (value?: string | number | Date | null): string | undefined => {
    if (value === undefined || value === null) return undefined;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
  };

  const startISO = toISO(item.start_date);
  const endISO = toISO(item.end_date);

  const datePart = startISO && endISO
    ? `${toThaiDate(startISO)} – ${toThaiDate(endISO)}`
    : (item.dateText.split("|")[0]?.trim() ?? "");

  const timePart = startISO && endISO
    ? toThaiTimeRange(startISO, endISO)
    : (item.dateText.split("|")[1]?.trim() ?? "");
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
        <div className={styles.media}>
          <div className={styles.cover_container}>
            <img
              src={posterSrc}
              alt={item.title}
              className={styles.cover}
              loading="lazy"
              onError={() => {
                if (posterSrc === FALLBACK_POSTER) return;
                setPosterSrc(FALLBACK_POSTER);
              }}
            />
          </div>

          <div className={styles.content}>
            <div className={styles.titleRow}>
              <h3 className={styles.title}>{item.title}</h3>
              {item.isPinned && (
                <span className={styles.pin} aria-label="ปักหมุด" />
              )}
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

            {item.description && (
              <p className={styles.desc}>{item.description}</p>
            )}
          </div>
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
