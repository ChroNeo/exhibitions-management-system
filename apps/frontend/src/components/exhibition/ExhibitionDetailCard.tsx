import styles from "./ExhibitionDetailCard.module.css";
import { MdOutlineCalendarToday } from "react-icons/md";
import { LuClock, LuBadgeCheck } from "react-icons/lu";
import { IoLocationOutline, IoPersonOutline } from "react-icons/io5";

export default function ExhibitionDetailCard({
  title,
  startText,
  endText,
  timeText,
  location,
  organizer,
  description,
  imageUrl,
  onEdit,
  onDelete,
  status,
}: {
  title: string;
  startText: string;
  endText: string;
  timeText: string;
  location?: string;
  organizer?: string;
  description?: string;
  imageUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  status?: string;
}) {
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>{title}</h2>

      <div className={styles.row}>
        <MdOutlineCalendarToday className={styles.icon} />
        <span>
          {startText} – {endText}
        </span>
      </div>

      <div className={styles.row}>
        <LuClock className={styles.icon} />
        <span>{timeText}</span>
      </div>

      {status && (
        <div className={styles.row}>
          <LuBadgeCheck className={styles.icon} />
          <span>สถานะ : {status}</span>
        </div>
      )}

      {location && (
        <div className={styles.row}>
          <IoLocationOutline className={styles.icon} />
          <span>{location}</span>
        </div>
      )}

      {organizer && (
        <div className={styles.row}>
          <IoPersonOutline className={styles.icon} />
          <span>{organizer}</span>
        </div>
      )}

      {imageUrl && (
        <div className={styles.imageWrap}>
          <img src={imageUrl} alt={title} />
        </div>
      )}

      {description && <p className={styles.desc}>{description}</p>}

      {(onEdit || onDelete) && (
        <div className={styles.actions}>
          {onEdit && (
            <button className={styles.primary} onClick={onEdit}>
              แก้ไข
            </button>
          )}
          {onDelete && (
            <button className={styles.ghost} onClick={onDelete}>
              ลบ
            </button>
          )}
        </div>
      )}
    </section>
  );
}
