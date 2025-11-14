import { MdOutlineCalendarToday } from "react-icons/md";
import { LuClock } from "react-icons/lu";
import { FiUser } from "react-icons/fi";
import { BsTag } from "react-icons/bs";
import DetailActions from "../DetailButton/DetailActions";
import styles from "./UnitDetailCard.module.css";

type Props = {
  title: string;
  dateText: string;
  timeText?: string;
  typeText?: string;
  staffText?: string;
  description?: string;
  descriptionHtml?: string;
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
  descriptionHtml,
  posterUrl,
  onEdit,
  onDelete,
}: Props) {
  const hasDescriptionHtml =
    typeof descriptionHtml === "string" && descriptionHtml.trim().length > 0;
  const hasDescriptionText =
    typeof description === "string" && description.trim().length > 0;

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        {posterUrl && (
          <div className={styles.thumbnail}>
            <img src={posterUrl} alt={title} loading="lazy" />
          </div>
        )}

        <div className={styles.meta}>
          <h3 className={styles.title}>{title}</h3>

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
      </div>

      {hasDescriptionHtml ? (
        <div
          className={styles.description}
          dangerouslySetInnerHTML={{ __html: descriptionHtml ?? "" }}
        />
      ) : hasDescriptionText ? (
        <p className={styles.description}>{description}</p>
      ) : null}

      <div className={styles.footer}>
        <DetailActions
          show={Boolean(onEdit || onDelete)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </section>
  );
}
