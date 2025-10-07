import type { KeyboardEvent, MouseEvent } from "react";
import styles from "./UnitExhibitionCard.module.css";
import { Edit2, Trash2 } from "lucide-react";
import type { IconType } from "react-icons";
import { MdOutlineCalendarToday } from "react-icons/md";
import { LuLayers } from "react-icons/lu";
import { IoLocationOutline } from "react-icons/io5";

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

type MetaItem = {
  Icon: IconType;
  text: string;
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

  const metaItems: MetaItem[] = [];

  const appendMetaItem = (text: string | undefined, Icon: IconType) => {
    if (!text) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    metaItems.push({ Icon, text: trimmed });
  };

  appendMetaItem(item.dateText, MdOutlineCalendarToday);
  appendMetaItem(item.typeLabel, LuLayers);
  appendMetaItem(item.location, IoLocationOutline);

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
      <div className={styles.inner}>
        <div className={styles.content}>
          <h3 className={styles.title}>{item.title}</h3>

          {metaItems.length > 0 && (
            <div className={styles.metaGroup}>
              {metaItems.map(({ Icon, text }, index) => (
                <div
                  key={`${item.id}-meta-${index}`}
                  className={styles.metaRow}
                >
                  <Icon className={styles.metaIcon} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          )}

          {item.description && (
            <p className={styles.desc}>{item.description}</p>
          )}
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
