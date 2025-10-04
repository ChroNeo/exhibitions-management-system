import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import styles from "../exhibition/form/ExManageForm.module.css";
import FormButtons from "../Detail/FormButtons";

export type UnitFormValues = {
  name: string;
  type: "booth" | "activity";
  starts_at: string;
  ends_at: string;
  staff_user_id: string;
  poster_url: string;
  description: string;
};

type Props = {
  mode: "view" | "edit" | "create";
  initialValues?: UnitFormValues;
  onSubmit?: (values: UnitFormValues) => Promise<void> | void;
  footer?: ReactNode;
  isSubmitting?: boolean;
};

const EMPTY_VALUES: UnitFormValues = {
  name: "",
  type: "activity",
  starts_at: "",
  ends_at: "",
  staff_user_id: "",
  poster_url: "",
  description: "",
};

const UnitForm = forwardRef<HTMLFormElement, Props>(function UnitForm(
  { mode, initialValues, onSubmit, footer, isSubmitting = false }: Props,
  ref,
) {
  const [values, setValues] = useState<UnitFormValues>(EMPTY_VALUES);

  useEffect(() => {
    if (!initialValues || mode === "create") {
      setValues(EMPTY_VALUES);
    } else {
      setValues({ ...initialValues });
    }
  }, [mode, initialValues]);

  const canSubmit = useMemo(() => mode === "edit" || mode === "create", [mode]);

  const updateValue = <K extends keyof UnitFormValues>(key: K, value: UnitFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement | null>(null);
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
    [ref],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !onSubmit || isSubmitting) return;
    await onSubmit(values);
  };

  const renderedFooter = footer ?? (
    <FormButtons
      onConfirm={() => formRef.current?.requestSubmit()}
      onCancel={() => navigate(-1)}
    />
  );

  return (
    <form ref={setFormRef} className={styles.formRoot} onSubmit={handleSubmit}>
      <div className={styles.ex_card}>
        <div className={`${styles.ex_group} ${styles.ex_name}`}>
          <label className={styles.ex_label}>ชื่อกิจกรรม</label>
          <input
            className={styles.ex_input}
            type="text"
            placeholder="เช่น Robotics Lab Demo"
            value={values.name}
            onChange={(e) => updateValue("name", e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className={`${styles.ex_group} ${styles.ex_location}`}>
          <label className={styles.ex_label}>ประเภทกิจกรรม</label>
          <select
            className={styles.ex_input}
            value={values.type}
            onChange={(e) => updateValue("type", e.target.value as UnitFormValues["type"])}
            disabled={isSubmitting}
          >
            <option value="booth">บูธ</option>
            <option value="activity">กิจกรรม</option>
          </select>
        </div>

        <div className={`${styles.ex_group} ${styles.ex_date}`}>
          <label className={styles.ex_label}>ช่วงเวลา</label>
          <div className={styles.ex_dates}>
            <input
              className={styles.ex_input}
              type="datetime-local"
              value={values.starts_at}
              onChange={(e) => updateValue("starts_at", e.target.value)}
              required
              disabled={isSubmitting}
            />
            <input
              className={styles.ex_input}
              type="datetime-local"
              value={values.ends_at}
              onChange={(e) => updateValue("ends_at", e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className={`${styles.ex_group} ${styles.ex_organizer}`}>
          <label className={styles.ex_label}>รหัสผู้ดูแล (ถ้ามี)</label>
          <input
            className={styles.ex_input}
            type="number"
            min={1}
            placeholder="กรอกรหัสผู้ดูแล"
            value={values.staff_user_id}
            onChange={(e) => updateValue("staff_user_id", e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className={`${styles.ex_group} ${styles.ex_file}`}>
          <label className={styles.ex_label}>ลิงก์โปสเตอร์ (ถ้ามี)</label>
          <input
            className={styles.ex_input}
            type="text"
            placeholder="uploads/units/filename.png"
            value={values.poster_url}
            onChange={(e) => updateValue("poster_url", e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className={`${styles.ex_group} ${styles.ex_details}`}>
          <label className={styles.ex_label}>รายละเอียด</label>
          <textarea
            className={styles.ex_textarea}
            rows={6}
            placeholder="รายละเอียดกิจกรรม"
            value={values.description}
            onChange={(e) => updateValue("description", e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {canSubmit && (
        <div className={styles.ex_actions}>{renderedFooter}</div>
      )}
    </form>
  );
});

export default UnitForm;
