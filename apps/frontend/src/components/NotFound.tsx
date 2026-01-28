import { Link } from "react-router-dom";
import styles from "./NotFound.module.css";

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>🔍</div>
      <h1 className={styles.errorCode}>404</h1>
      <h2 className={styles.title}>ไม่พบหน้าที่คุณต้องการ</h2>
      <p className={styles.description}>
        หน้าที่คุณกำลังมองหาอาจถูกลบ เปลี่ยนชื่อ หรือไม่มีอยู่ในขณะนี้
      </p>
      <Link to="/" className={styles.button}>
        <span className={styles.buttonIcon}>←</span>
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
