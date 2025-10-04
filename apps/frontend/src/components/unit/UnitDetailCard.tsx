import { MdOutlineCalendarToday } from "react-icons/md";
import { LuClock } from "react-icons/lu";
import { FiUser } from "react-icons/fi";
import { BsTag } from "react-icons/bs";
import DetailActions from "../Detail/DetailActions";
import styles from "./UnitDetailCard.module.css";

type Props = {
  title: string;
  dateText: string;
  timeText?: string;
  typeText?: string;
  staffText?: string;
  description?: string;
  posterUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function UnitDetailCard({
  title,
  dateText,
  timeText,
  typeText,
  staffText,
  description,
  posterUrl,
  onEdit,
  onDelete,
}: Props) {
  return (
    <section className={styles.card}>
      <header className={styles.heading}>
        <h3 className={styles.title}>{title}</h3>
      </header>

      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <MdOutlineCalendarToday className={styles.metaIcon} />
          <span>{dateText}</span>
        </div>

        {timeText && (
          <div className={styles.metaRow}>
            <LuClock className={styles.metaIcon} />
            <span>{timeText}</span>
          </div>
        )}

        {typeText && (
          <div className={styles.metaRow}>
            <BsTag className={styles.metaIcon} />
            <span>{typeText}</span>
          </div>
        )}

        {staffText && (
          <div className={styles.metaRow}>
            <FiUser className={styles.metaIcon} />
            <span>{staffText}</span>
          </div>
        )}
      </div>

      {posterUrl && (
        <div className={styles.poster}>
          <img src={posterUrl} alt={title} loading="lazy" />
        </div>
      )}

      {description && description.trim().length > 0 && (
        <p className={styles.description}>{description}</p>
      )}

      <div className={styles.footer}>
        <DetailActions show={Boolean(onEdit || onDelete)} onEdit={onEdit ?? (() => {})} onDelete={onDelete} />
      </div>
    </section>
  );
}
