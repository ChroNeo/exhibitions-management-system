import { FaEdit } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import styles from "./Button.module.css";

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
};

export default function FormButtons({ onConfirm, onCancel }: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "16px",
        marginTop: "20px",
      }}
    >
      <button className={`${styles.btn} ${styles.confirm}`} onClick={onConfirm}>
        <FaEdit className={styles.icon} />
        ยืนยัน
      </button>
      <button className={`${styles.btn} ${styles.cancel}`} onClick={onCancel}>
        <MdClose className={styles.icon} />
        ยกเลิก
      </button>
    </div>
  );
}
