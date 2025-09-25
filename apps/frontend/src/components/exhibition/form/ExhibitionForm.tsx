import { useEffect, useMemo, useState } from "react";
import styles from "./ExManageForm.module.css";

export type ExhibitionFormValues = {
  title: string;
  start_date: string; // 'YYYY-MM-DDTHH:mm'
  end_date: string;   // 'YYYY-MM-DDTHH:mm'
  location: string;
  organizer_name: string;
  description: string;
  file?: File | undefined; // รูป/ไฟล์โปสเตอร์
};

type Props = {
  mode: "view" | "edit" | "create";
  initialValues?: ExhibitionFormValues;
  readOnly?: boolean;                // โหมด view → true
  onSubmit?: (v: ExhibitionFormValues) => Promise<void> | void;
};

export default function ExhibitionForm({
  mode,
  initialValues,
  readOnly = false,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<ExhibitionFormValues>({
    title: "",
    start_date: "",
    end_date: "",
    location: "",
    organizer_name: "",
    description: "",
    file: undefined,
  });

  useEffect(() => {
    if (mode === "create" || !initialValues) {
      setValues({
        title: "",
        start_date: "",
        end_date: "",
        location: "",
        organizer_name: "",
        description: "",
        file: undefined,
      });
    } else {
      setValues({ ...initialValues, file: undefined });
    }
  }, [mode, initialValues]);

  const disabled = !!readOnly;
  useEffect(() => console.log("form disabled:", disabled), [disabled]);
  const canSubmit = useMemo(() => mode === "edit" || mode === "create", [mode]);

  const set = (k: keyof ExhibitionFormValues, v: any) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !onSubmit) return;
    await onSubmit(values);
  };

  return (
    <form className={`${styles.exd_containers} ${styles.ex_card}`} onSubmit={handleSubmit}>
      <div className={`${styles.ex_group} ${styles.ex_name}`}>
        <label className={styles.ex_label}>ชื่อนิทรรศการ</label>
        <input
          className={styles.ex_input}
          type="text"
          placeholder="เช่น Smart Tech Expo"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className={`${styles.ex_group} ${styles.ex_date}`}>
        <label className={styles.ex_label}>วันที่</label>
        <div className={styles.ex_dates}>
          <input
            className={styles.ex_input}
            type="datetime-local"
            value={values.start_date}
            onChange={(e) => set("start_date", e.target.value)}
            disabled={disabled}
          />
          <input
            className={styles.ex_input}
            type="datetime-local"
            value={values.end_date}
            onChange={(e) => set("end_date", e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className={`${styles.ex_group} ${styles.ex_location}`}>
        <label className={styles.ex_label}>สถานที่จัด</label>
        <input
          className={styles.ex_input}
          type="text"
          placeholder="เช่น Bangkok Convention Center"
          value={values.location}
          onChange={(e) => set("location", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className={`${styles.ex_group} ${styles.ex_file}`}>
        <label className={styles.ex_label}>แนบไฟล์ (ถ้ามี)</label>
        <input
          className={styles.ex_input}
          type="file"
          onChange={(e) => set("file", e.target.files?.[0])}
          disabled={disabled}
        />
      </div>

      <div className={`${styles.ex_group} ${styles.ex_organizer}`}>
        <label className={styles.ex_label}>ผู้รับผิดชอบ</label>
        <input
          className={styles.ex_input}
          type="text"
          placeholder="ชื่อผู้จัด/หน่วยงาน"
          value={values.organizer_name}
          onChange={(e) => set("organizer_name", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className={`${styles.ex_group} ${styles.ex_details}`}>
        <label className={styles.ex_label}>รายละเอียด</label>
        <textarea
          className={styles.ex_textarea}
          rows={6}
          placeholder="สรุปเนื้อหา กิจกรรม ไฮไลต์"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          disabled={disabled}
        />
      </div>

      {canSubmit && (
        <div className={styles.ex_actions}>
          <button className={styles.ex_submit} type="submit">บันทึก</button>
        </div>
      )}
    </form>
  );
}
