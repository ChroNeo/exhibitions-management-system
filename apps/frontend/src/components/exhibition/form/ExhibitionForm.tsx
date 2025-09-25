import styles from "./ExManageForm.module.css";

export default function ExhibitionForm() {
  return (
    <div className={`${styles.exd_containers} ${styles.ex_card}`}>
      <div className={`${styles.ex_group} ${styles.ex_name}`}>
        <label className={styles.ex_label}>ชื่อนิทรรศการ</label>
        <input
          className={styles.ex_input}
          type="text"
          placeholder="เช่น Smart Tech Expo"
        />
      </div>

      <div className={`${styles.ex_group} ${styles.ex_date}`}>
        <label className={styles.ex_label}>วันที่</label>
        <div className={styles.ex_dates}>
          <input className={styles.ex_input} type="datetime-local" />
          <input className={styles.ex_input} type="datetime-local" />
        </div>
      </div>

      <div className={`${styles.ex_group} ${styles.ex_location}`}>
        <label className={styles.ex_label}>สถานที่จัด</label>
        <input
          className={styles.ex_input}
          type="text"
          placeholder="เช่น Bangkok Convention Center"
        />
      </div>

      <div className={`${styles.ex_group} ${styles.ex_file}`}>
        <label className={styles.ex_label}>แนบไฟล์ (ถ้ามี)</label>
        <input className={styles.ex_input} type="file" />
      </div>

      <div className={`${styles.ex_group} ${styles.ex_organizer}`}>
        <label className={styles.ex_label}>ผู้รับผิดชอบ</label>
        <input
          className={styles.ex_input}
          type="text"
          placeholder="ชื่อผู้จัด/หน่วยงาน"
        />
      </div>

      <div className={`${styles.ex_group} ${styles.ex_details}`}>
        <label className={styles.ex_label}>รายละเอียด</label>
        <textarea
          className={styles.ex_textarea}
          rows={6}
          placeholder="สรุปเนื้อหา กิจกรรม ไฮไลต์"
        />
      </div>
    </div>
  );
}
