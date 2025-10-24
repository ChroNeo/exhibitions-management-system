import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, ReactNode } from "react";
import styles from "./ExManageForm.module.css";
import FormButtons from "../../Detail/FormButtons";
import { useNavigate } from "react-router-dom";

const DEFAULT_STATUS = "draft";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  ongoing: "Ongoing",
  ended: "Ended",
  archived: "Archived",
};

const EDITABLE_STATUS_VALUES = ["draft", "published", "archived"];

export type ExhibitionFormValues = {
  title: string;
  start_date: string; // YYYY-MM-DDTHH:mm
  end_date: string; // YYYY-MM-DDTHH:mm
  location: string;
  organizer_name: string;
  description: string;
  status: string;
  file?: File | undefined;
};

type Props = {
  mode: "view" | "edit" | "create";
  initialValues?: ExhibitionFormValues;
  initialFileName?: string;
  readOnly?: boolean;
  onSubmit?: (v: ExhibitionFormValues) => Promise<void> | void;
  footer?: ReactNode;
};

const ExhibitionForm = forwardRef<HTMLFormElement, Props>(function ExhibitionForm(
  {
    mode,
    initialValues,
    initialFileName,
    readOnly = false,
    onSubmit,
    footer,
  }: Props,
  ref
) {
  const [values, setValues] = useState<ExhibitionFormValues>({
    title: "",
    start_date: "",
    end_date: "",
    location: "",
    organizer_name: "",
    description: "",
    status: DEFAULT_STATUS,
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
        status: DEFAULT_STATUS,
        file: undefined,
      });
    } else {
      setValues({
        ...initialValues,
        status: initialValues.status ?? DEFAULT_STATUS,
        file: undefined,
      });
    }
  }, [mode, initialValues]);

  const disabled = !!readOnly;
  const canSubmit = useMemo(() => mode === "edit" || mode === "create", [mode]);

  const displayedFileName = useMemo(() => {
    if (values.file) return values.file.name;
    if (initialFileName) return initialFileName;
    return "ยังไม่ได้เลือกไฟล์";
  }, [values.file, initialFileName]);

  const statusOptions = useMemo(() => {
    const baseValues =
      mode === "edit" ? EDITABLE_STATUS_VALUES : [DEFAULT_STATUS];
    const mergedValues = [...baseValues];

    if (values.status && !mergedValues.includes(values.status)) {
      mergedValues.push(values.status);
    }

    return mergedValues.map((value) => ({
      value,
      label: STATUS_LABELS[value] ?? value,
    }));
  }, [mode, values.status]);

  const set = (k: keyof ExhibitionFormValues, v: unknown) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !onSubmit) return;
    await onSubmit(values);
  };

  // ใช้ ref เพื่อกด submit จากปุ่มยืนยัน
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
  const setFormRef = useCallback(
    (node: HTMLFormElement | null) => {
      formRef.current = node;
      if (!ref) return;
      if (typeof ref === "function") {
        ref(node);
      } else {
        (ref as MutableRefObject<HTMLFormElement | null>).current = node;
      }
    },
    [ref]
  );

  return (
    <form ref={setFormRef} className={styles.formRoot} onSubmit={handleSubmit}>
      {/* กรอบส้มครอบเฉพาะฟิลด์ */}
      <div className={styles.ex_card}>
        <div className={`${styles.ex_group} ${styles.ex_name}`}>
          <label className={styles.ex_label}>ชื่องานนิทรรศการ</label>
          <input
            className={styles.ex_input}
            type="text"
            placeholder="เช่น Smart Tech Expo"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className={styles.ex_group}>
          <label className={styles.ex_label}>สถานะ</label>
          <select
            className={styles.ex_input}
            value={values.status}
            onChange={(e) => set("status", e.target.value)}
            disabled={disabled || mode === "create"}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={`${styles.ex_group} ${styles.ex_date}`}>
          <label className={styles.ex_label}>ช่วงเวลา</label>
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
          <label className={styles.ex_label}>สถานที่จัดงาน</label>
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
          <label className={styles.ex_label}>ไฟล์รูปภาพ (ถ้ามี)</label>
          <input
            className={styles.ex_input}
            type="file"
            onChange={(e) => set("file", e.target.files?.[0])}
            disabled={disabled}
          />
          <p className={styles.ex_fileName} aria-live="polite">
            {displayedFileName}
          </p>
        </div>

        <div className={`${styles.ex_group} ${styles.ex_organizer}`}>
          <label className={styles.ex_label}>ผู้จัดงาน</label>
          <input
            className={styles.ex_input}
            type="text"
            placeholder="ชื่อหน่วยงาน/บริษัท"
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
            placeholder="รายละเอียดเพิ่มเติมของนิทรรศการ"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* ปุ่มอยู่นอกกรอบส้ม */}
      {canSubmit && (
        <div className={styles.ex_actions}>
          {footer !== undefined ? (
            footer
          ) : (
            <FormButtons
              onConfirm={() => formRef.current?.requestSubmit()}
              onCancel={() => navigate(-1)}
            />
          )}
        </div>
      )}
    </form>
  );
});

export default ExhibitionForm;

