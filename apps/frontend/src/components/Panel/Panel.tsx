import type { ReactNode } from "react";
import styles from "./Panel.module.css";
import { FaArrowLeft } from "react-icons/fa6";

type PanelProps = {
  title: string;
  children: ReactNode;
  onBack?: () => void;
};

export default function Panel({ title, children, onBack }: PanelProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className={styles.backLink}
            aria-label="Go back"
          >
            <FaArrowLeft />
          </button>
        ) : (
          <span className={styles.backPlaceholder} aria-hidden="true" />
        )}

        <h2 className={styles.title}>{title}</h2>
      </div>

      <div className={styles.body}>{children}</div>
    </section>
  );
}
