import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, ReactNode } from "react";
import Quill from "quill";
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

type DescriptionState = Pick<ExhibitionFormValues, "description" | "description_delta">;

export type ExhibitionFormValues = {
  title: string;
  start_date: string; // YYYY-MM-DDTHH:mm
  end_date: string; // YYYY-MM-DDTHH:mm
  location: string;
  organizer_name: string;
  description: string;
  description_delta: string;
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
    description_delta: "",
    status: DEFAULT_STATUS,
    file: undefined,
  });

  const quillContainerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const suppressQuillEventRef = useRef(false);
  const pendingEditorValueRef = useRef<DescriptionState | null>(null);

  const applyEditorValue = useCallback(
    (payload: DescriptionState) => {
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
            console.warn("Failed to parse description delta", error);
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
    },
    []
  );

  useEffect(() => {
    if (mode === "create" || !initialValues) {
      const emptyValues: ExhibitionFormValues = {
        title: "",
        start_date: "",
        end_date: "",
        location: "",
        organizer_name: "",
        description: "",
        description_delta: "",
        status: DEFAULT_STATUS,
        file: undefined,
      };
      setValues(emptyValues);
      applyEditorValue(emptyValues);
    } else {
      const nextValues: ExhibitionFormValues = {
        ...initialValues,
        status: initialValues.status ?? DEFAULT_STATUS,
        description: initialValues.description ?? "",
        description_delta: initialValues.description_delta ?? "",
        file: undefined,
      };
      setValues(nextValues);
      applyEditorValue(nextValues);
    }
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
      placeholder: "รายละเอียดเพิ่มเติมของนิทรรศการ",
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

  const disabled = !!readOnly;
  const canSubmit = useMemo(() => mode === "edit" || mode === "create", [mode]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    quill.enable(!disabled);
    const toolbarModule = quill.getModule("toolbar") as
      | { container?: HTMLElement }
      | undefined;
    if (toolbarModule && toolbarModule.container instanceof HTMLElement) {
      toolbarModule.container.style.display = disabled ? "none" : "";
    }
  }, [disabled]);

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
          <div
            className={styles.ex_editor}
            data-readonly={disabled ? "true" : "false"}
          >
            <div
              ref={quillContainerRef}
              aria-label="รายละเอียดเพิ่มเติมของนิทรรศการ"
            />
          </div>
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



