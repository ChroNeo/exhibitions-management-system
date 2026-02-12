import { useState, useRef, useEffect, useMemo } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Link } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import { FaEdit } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import styles from "./UnitExhibitionCard.module.css";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClick = () => onSelect?.(item.id);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(item.id);
    }
  };

  const toggleMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  const handleEditClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setMenuOpen(false);
    onEdit?.(item.id);
  };

  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setMenuOpen(false);
    onDelete?.(item.id);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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
      <div className={`${styles.media} ${!item.posterUrl ? styles.mediaBg : ""}`}>
        {item.posterUrl ? (
          <div className={styles.posterWrap}>
            <img
              src={item.posterUrl}
              alt={item.title}
              className={styles.poster}
              loading="lazy"
            />
          </div>
        ) : (
          <div className={styles.initialBadge} aria-hidden="true">
            {posterInitial}
          </div>
        )}

        {hasActions && (
          <div className={styles.kebabWrap} ref={menuRef}>
            <button
              type="button"
              onClick={toggleMenu}
              className={`${styles.kebabBtn} ${menuOpen ? styles.kebabBtnActive : ""}`}
              aria-label="เมนู"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div className={styles.kebabMenu}>
                {onEdit && (
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={handleEditClick}
                  >
                    <FaEdit className={styles.menuIcon} /> แก้ไข
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
                    onClick={handleDeleteClick}
                  >
                    <FiTrash2 className={styles.menuIcon} /> ลบ
                  </button>
                )}
              </div>
            )}
          </div>
        )}
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
      </div>
    </div>
  );
}
