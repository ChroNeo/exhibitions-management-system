import styles from "./ExhibitionCard.module.css";
import { Edit2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { Exhibition } from "./../../types/exhibition";

export default function ExhibitionCard({
  item,
  onEdit,
  onSelect,
}: {
  item: Exhibition;
  onEdit?: (id: string) => void;
  onSelect?: (id: string) => void;
}) {
  const handleCardClick = () => {
    onSelect?.(item.id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(item.id);
    }
  };

  return (
    <div
      className={styles.card}
      onClick={handleCardClick}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.inner}>
        {item.coverUrl ? (
          <img src={item.coverUrl} alt={item.title} className={styles.cover} />
        ) : (
          <div className={styles.cover} />
        )}
        <div>
          <h3 className={styles.title}>
            {item.title}
            {item.isPinned && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: "#38bdf8",
                }}
              />
            )}
          </h3>
          {item.description && (
            <p className={styles.desc}>{item.description}</p>
          )}
          <p className={styles.meta}>{item.dateText}</p>
          <p className={styles.meta}>สถานที่ {item.location}</p>
        </div>
        <div>
          <button
            className={styles.editBtn}
            onClick={(event) => {
              event.stopPropagation();
              onEdit?.(item.id);
            }}
            title="แก้ไข"
          >
            <Edit2 size={16} /> แก้ไข
          </button>
        </div>
      </div>
    </div>
  );
}
