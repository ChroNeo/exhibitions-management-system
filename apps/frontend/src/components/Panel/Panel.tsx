import type { icons } from "lucide-react";
import styles from "./Panel.module.css";
import { FaArrowLeft } from "react-icons/fa6";

export default function Panel({
  title,
  children,
  onBack,
}: {
  title: string;
  children: React.ReactNode;
  onBack: () => void;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <a href="#" onClick={onBack} className={styles.backLink}>
          <FaArrowLeft />
        </a>
        <h2 className={styles.title}>{title}</h2>
      </div>

      <div className={styles.body}>{children}</div>
    </section>
  );
}
