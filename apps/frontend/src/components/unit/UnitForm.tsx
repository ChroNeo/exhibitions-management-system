import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Quill from "quill";

import styles from "../exhibition/form/ExManageForm.module.css";
import FormButtons from "../Detail/FormButtons";
import { ensureQuillDeltaString } from "../../utils/text";

export type UnitFormValues = {
  name: string;
  type: "booth" | "activity";
  starts_at: string;
  ends_at: string;
  staff_user_id: string;
  description: string;
  description_delta: string;
  file?: File;
};

type DescriptionState = Pick<UnitFormValues, "description" | "description_delta">;

type Props = {
  mode: "view" | "edit" | "create";
  initialValues?: UnitFormValues;
  onSubmit?: (values: UnitFormValues) => Promise<void> | void;
  footer?: ReactNode;
  isSubmitting?: boolean;
  initialPosterName?: string;
};

const EMPTY_VALUES: UnitFormValues = {
  name: "",
  type: "activity",
  starts_at: "",
  ends_at: "",
  staff_user_id: "",
  description: "",
  description_delta: "",
  file: undefined,
};

const UnitForm = forwardRef<HTMLFormElement, Props>(function UnitForm(
  { mode, initialValues, onSubmit, footer, isSubmitting = false, initialPosterName }: Props,
  ref
) {
  const [values, setValues] = useState<UnitFormValues>(EMPTY_VALUES);
  const quillContainerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const suppressQuillEventRef = useRef(false);
  const pendingEditorValueRef = useRef<DescriptionState | null>(null);

  const applyEditorValue = useCallback((payload: DescriptionState) => {
    const quill = quillRef.current;
    if (!quill) {
      pendingEditorValueRef.current = payload;
      return;
    }

    suppressQuillEventRef.current = true;
    try {
      if (payload.description_delta) {
        try {
          const parsed = JSON.parse(payload.description_delta);
          quill.setContents(parsed);
        } catch (error) {
          console.warn("Failed to parse unit description delta", error);
          quill.clipboard.dangerouslyPasteHTML(payload.description ?? "");
        }
      } else if (payload.description) {
        quill.clipboard.dangerouslyPasteHTML(payload.description);
      } else {
        quill.setText("");
      }
      quill.setSelection(0, 0);
    } finally {
      suppressQuillEventRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!initialValues || mode === "create") {
      const emptyState: UnitFormValues = { ...EMPTY_VALUES };
      setValues(emptyState);
      applyEditorValue(emptyState);
      return;
    }

    const nextValues: UnitFormValues = {
      ...initialValues,
      description: initialValues.description ?? "",
      description_delta: ensureQuillDeltaString(initialValues.description_delta) ?? "",
      file: undefined,
    };
    setValues(nextValues);
    applyEditorValue(nextValues);
  }, [mode, initialValues, applyEditorValue]);

  useEffect(() => {
    const container = quillContainerRef.current;
    if (!container || quillRef.current) return;

    container.innerHTML = "";
    container.removeAttribute("class");
    container.removeAttribute("style");
    container.removeAttribute("tabindex");
    container.removeAttribute("data-gramm");
    container.removeAttribute("contenteditable");
    container.removeAttribute("role");

    const wrapper = container.parentElement;
    if (wrapper) {
      wrapper.querySelectorAll(".ql-toolbar").forEach((node) => {
        if (node instanceof HTMLElement) node.remove();
      });
    }

    const toolbarOptions = [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ];

    const quill = new Quill(container, {
      theme: "snow",
      modules: { toolbar: toolbarOptions },
      placeholder: "รายละเอียดกิจกรรม",
    });

    const handleTextChange = () => {
      if (suppressQuillEventRef.current) return;
      const html = quill.root.innerHTML;
      const plainText = quill.getText().trim();

      if (!plainText.length || html === "<p><br></p>") {
        setValues((prev) => {
          if (!prev.description && !prev.description_delta) return prev;
          return { ...prev, description: "", description_delta: "" };
        });
        return;
      }

      const deltaString = JSON.stringify(quill.getContents());
      setValues((prev) => {
        if (prev.description === html && prev.description_delta === deltaString) {
          return prev;
        }
        return {
          ...prev,
          description: html,
          description_delta: deltaString,
        };
      });
    };

    quill.on("text-change", handleTextChange);
    quillRef.current = quill;

    if (pendingEditorValueRef.current) {
      applyEditorValue(pendingEditorValueRef.current);
      pendingEditorValueRef.current = null;
    } else {
      applyEditorValue({
        description: values.description,
        description_delta: values.description_delta,
      });
    }

    return () => {
      quill.off("text-change", handleTextChange);
      quillRef.current = null;
      if (wrapper) {
        wrapper.querySelectorAll(".ql-toolbar").forEach((node) => {
          if (node instanceof HTMLElement) node.remove();
        });
      }
      container.innerHTML = "";
      container.removeAttribute("class");
      container.removeAttribute("style");
      container.removeAttribute("tabindex");
      container.removeAttribute("data-gramm");
      container.removeAttribute("contenteditable");
      container.removeAttribute("role");
    };
  }, [applyEditorValue]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    quill.enable(!isSubmitting);
    const toolbarModule = quill.getModule("toolbar") as { container?: HTMLElement } | undefined;
    if (toolbarModule?.container) {
      toolbarModule.container.style.display = isSubmitting ? "none" : "";
    }
  }, [isSubmitting]);

  const canSubmit = useMemo(() => mode === "edit" || mode === "create", [mode]);

  const updateValue = <K extends keyof UnitFormValues>(key: K, value: UnitFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const displayedPosterName = useMemo(() => {
    if (values.file) return values.file.name;
    if (initialPosterName) return initialPosterName;
    return "ยังไม่ได้เลือกไฟล์";
  }, [values.file, initialPosterName]);

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
    [ref]
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
          <label className={styles.ex_label} htmlFor="unit-poster-input">
            อัปโหลดโปสเตอร์ (ถ้ามี)
          </label>
          <input
            id="unit-poster-input"
            className={styles.ex_input}
            type="file"
            accept="image/*"
            onChange={(e) => updateValue("file", e.target.files?.[0])}
            disabled={isSubmitting}
          />
          <p className={styles.ex_fileName} aria-live="polite">
            {displayedPosterName}
          </p>
        </div>

        <div className={`${styles.ex_group} ${styles.ex_details}`}>
          <label className={styles.ex_label}>รายละเอียด</label>
          <div className={styles.ex_editor} data-readonly={isSubmitting ? "true" : "false"}>
            <div ref={quillContainerRef} aria-label="รายละเอียดกิจกรรม" />
          </div>
        </div>
      </div>

      {canSubmit && <div className={styles.ex_actions}>{renderedFooter}</div>}
    </form>
  );
});

export default UnitForm;
