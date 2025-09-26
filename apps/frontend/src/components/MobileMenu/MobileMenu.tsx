import { useNavigate } from "react-router-dom";
import styles from "./MobileMenu.module.css";

export type MenuKey = "profile" | "exhibition" | "activity" | "summary";

export default function MobileMenu({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (k: MenuKey) => void;
}) {
  const navigate = useNavigate();
  if (!open) return null;
  const go = (k: MenuKey) => {
    onSelect(k);
    onClose();
  };
  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <aside className={styles.sheet}>
        <div className={styles.top}>Exhibitions</div>
        <div className={styles.block}>
          <button className={styles.item} onClick={() => go("profile")}>
            โปรไฟล์
          </button>
          <div className={styles.hr} />
          <button
            className={styles.item}
            onClick={() => navigate("/exhibitions")}
          >
            นิทรรศการ
          </button>
          <div className={styles.hr} />
          <button
            className={styles.item}
            onClick={() => navigate("/activities")}
          >
            กิจกรรม
          </button>
          <div className={styles.hr} />
          <button className={styles.item} onClick={() => go("summary")}>
            สรุปข้อมูล
          </button>
        </div>
      </aside>
    </>
  );
}
