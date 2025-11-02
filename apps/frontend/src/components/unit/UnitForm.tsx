// components/units/UnitForm.tsx
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MutableRefObject, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type QuillType from "quill";
import Swal from "sweetalert2";
import styles from "../exhibition/form/ExManageForm.module.css";
import FormButtons from "../Detail/FormButtons";
import { initializeRichTextEditor } from "../../utils/quill";
import { toDeltaObject, toDeltaString } from "../../utils/quillDelta";

export type UnitFormValues = {
  name: string;
  type: "booth" | "activity";
  starts_at: string;
  ends_at: string;
  staff_user_id: string | null;
  description?: string;
  description_delta: string;
  file?: File;
};

type Draft = {
  description_delta: string;
  form: Partial<UnitFormValues>;
  savedAt: number;
  exhibitionId?: string | number;
  unitId?: string | number;
  version: 1;
};

type Props = {
  mode: "view" | "edit" | "create";
  unitId?: string | number;
  exhibitionId?: string | number;
  initialValues?: Partial<UnitFormValues> & { updated_at?: string | null };
  onSubmit?: (values: UnitFormValues) => Promise<void> | void;
  footer?: ReactNode;
  isSubmitting?: boolean;
  initialPosterName?: string;
};

const EMPTY: UnitFormValues = {
  name: "",
  type: "activity",
  starts_at: "",
  ends_at: "",
  staff_user_id: null,
  description_delta: "",
  file: undefined,
};

type QuillSource = "user" | "api" | "silent";
type DeltaLike = { ops: unknown[] };
type TextChangeHandler = (
  delta: DeltaLike,
  oldDelta: DeltaLike,
  source: QuillSource
) => void;

const storageKey = (
  exId?: string | number,
  unitId?: string | number,
  mode?: Props["mode"]
) =>
  `ems:unit:draft:v1:${exId ?? "no-ex"}:${unitId ?? `new-${mode ?? "create"}`}`;

const UnitForm = forwardRef<HTMLFormElement, Props>(function UnitForm(
  {
    mode,
    unitId,
    exhibitionId,
    initialValues,
    onSubmit,
    footer,
    isSubmitting = false,
    initialPosterName,
  }: Props,
  ref
) {
  const [form, setForm] = useState<UnitFormValues>({
    ...EMPTY,
    ...initialValues,
  });
  const quillElRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<QuillType | null>(null);
  const [quillReady, setQuillReady] = useState(false);

  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement | null>(null);
  const setFormRef = useCallback(
    (node: HTMLFormElement | null) => {
      formRef.current = node;
      if (!ref) return;
      if (typeof ref === "function") ref(node);
      else (ref as MutableRefObject<HTMLFormElement | null>).current = node;
    },
    [ref]
  );

  const canSubmit = mode === "edit" || mode === "create";
  const update = <K extends keyof UnitFormValues>(k: K, v: UnitFormValues[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // init Quill
  useEffect(() => {
    if (!quillElRef.current || quillRef.current) return;

    const { quill, cleanup } = initializeRichTextEditor({
      container: quillElRef.current,
      placeholder: "รายละเอียดกิจกรรม",
    });

    const handleTextChange: TextChangeHandler = (_d, _o, source) => {
      if (source !== "user") return;
      const deltaString = JSON.stringify(quill.getContents());
      setForm((p) =>
        p.description_delta === deltaString
          ? p
          : { ...p, description_delta: deltaString }
      );
    };

    quill.on("text-change", handleTextChange);
    quillRef.current = quill;
    setQuillReady(true);

    return () => {
      quill.off("text-change", handleTextChange);
      quillRef.current = null;
      setQuillReady(false);
      cleanup();
    };
  }, []);

  // apply server values
  useEffect(() => {
    const quill = quillRef.current;
    if (!quillReady || !quill) return;

    const deltaObj = toDeltaObject(initialValues?.description_delta);

    // only-HTML case
    if (
      (!initialValues?.description_delta ||
        toDeltaString(initialValues?.description_delta) === "") &&
      initialValues?.description
    ) {
      const clip = quill.clipboard.convert({ html: initialValues.description });
      quill.setContents(clip, "silent");
      setForm((p) => ({
        ...p,
        ...EMPTY,
        ...initialValues,
        description_delta: JSON.stringify(clip),
      }));
      return;
    }

    quill.setContents(deltaObj, "silent");
    setForm((p) => ({
      ...p,
      ...EMPTY,
      ...initialValues,
      description_delta: toDeltaString(initialValues?.description_delta),
    }));
  }, [mode, initialValues, quillReady]);

  // load draft (scoped)
  useEffect(() => {
    const quill = quillRef.current;
    if (!quillReady || !quill) return;

    const key = storageKey(exhibitionId, unitId, mode);
    const raw = localStorage.getItem(key);
    if (!raw) return;

    try {
      const draft: Draft = JSON.parse(raw);
      const sameScope =
        draft.version === 1 &&
        draft.exhibitionId === exhibitionId &&
        draft.unitId === unitId;
      if (!sameScope) return;

      const serverUpdatedAt = initialValues?.updated_at
        ? new Date(initialValues.updated_at).getTime()
        : 0;

      if (draft.savedAt > serverUpdatedAt) {
        const deltaObj = toDeltaObject(draft.description_delta);
        quill.setContents(deltaObj, "silent");
        setForm((p) => ({
          ...p,
          ...EMPTY,
          ...initialValues,
          ...draft.form,
          description_delta: toDeltaString(draft.description_delta),
        }));
      }
    } catch {
      /* ignore */
    }
  }, [exhibitionId, unitId, mode, initialValues, quillReady]);

  // disable while submitting
  useEffect(() => {
    const quill = quillRef.current;
    if (!quillReady || !quill) return;
    quill.enable(!isSubmitting);

    type QuillToolbarModule = { container?: HTMLElement };
    const toolbarModule = quill.getModule("toolbar") as
      | QuillToolbarModule
      | undefined;
    const toolbar = toolbarModule?.container;
    if (toolbar) toolbar.style.display = isSubmitting ? "none" : "";
  }, [isSubmitting, quillReady]);

  // autosave draft (debounced)
  useEffect(() => {
    const quill = quillRef.current;
    if (!quillReady || !quill) return;

    const key = storageKey(exhibitionId, unitId, mode);
    let t: number | null = null;

    const saveDraft = () => {
      const payload: Draft = {
        description_delta: JSON.stringify(quill.getContents()),
        form: {
          name: form.name,
          type: form.type,
          starts_at: form.starts_at,
          ends_at: form.ends_at,
          staff_user_id: form.staff_user_id ?? null,
        },
        savedAt: Date.now(),
        exhibitionId,
        unitId,
        version: 1,
      };
      localStorage.setItem(key, JSON.stringify(payload));
    };

    const onText: TextChangeHandler = (_d, _o, source) => {
      if (source !== "user") return;
      if (t) window.clearTimeout(t);
      t = window.setTimeout(saveDraft, 400);
    };

    quill.on("text-change", onText);

    if (t) window.clearTimeout(t);
    t = window.setTimeout(saveDraft, 400);

    return () => {
      quill.off("text-change", onText);
      if (t) window.clearTimeout(t);
    };
  }, [
    form.name,
    form.type,
    form.starts_at,
    form.ends_at,
    form.staff_user_id,
    exhibitionId,
    unitId,
    mode,
    quillReady,
  ]);

  // prune very-old drafts (optional)
  useEffect(() => {
    const key = storageKey(exhibitionId, unitId, mode);
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const draft: Draft = JSON.parse(raw);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - draft.savedAt > sevenDays) localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, [exhibitionId, unitId, mode]);

  // warn before unload
  useEffect(() => {
    const key = storageKey(exhibitionId, unitId, mode);
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (localStorage.getItem(key)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [exhibitionId, unitId, mode]);

  const displayedPosterName = useMemo(() => {
    if (form.file) return form.file.name;
    if (initialPosterName) return initialPosterName;
    return "ยังไม่ได้เลือกไฟล์";
  }, [form.file, initialPosterName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !onSubmit || isSubmitting) return;

    if (
      form.starts_at &&
      form.ends_at &&
      new Date(form.starts_at) >= new Date(form.ends_at)
    ) {
      await Swal.fire({
        icon: "error",
        title: "ข้อมูลช่วงเวลาไม่ถูกต้อง",
        text: "วันเริ่มต้นต้องมาก่อนวันสิ้นสุด",
        confirmButtonText: "ปิด",
      });
      return;
    }

    const quill = quillRef.current;
    const html = quill ? quill.root.innerHTML : "";
    const deltaStr = quill ? JSON.stringify(quill.getContents()) : "";

    const payload: UnitFormValues = {
      ...form,
      description: html === "<p><br></p>" ? "" : html,
      description_delta: deltaStr,
    };

    await onSubmit(payload);
    localStorage.removeItem(storageKey(exhibitionId, unitId, mode));
  };

  const renderedFooter =
    footer !== undefined ? (
      footer
    ) : (
      <div className={styles.ex_actions}>
        <FormButtons
          onConfirm={() => formRef.current?.requestSubmit()}
          onCancel={() => navigate(-1)}
        />
      </div>
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
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className={`${styles.ex_group} ${styles.ex_location}`}>
          <label className={styles.ex_label}>ประเภทกิจกรรม</label>
          <select
            className={styles.ex_input}
            value={form.type}
            onChange={(e) =>
              update("type", e.target.value as UnitFormValues["type"])
            }
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
              value={form.starts_at}
              onChange={(e) => update("starts_at", e.target.value)}
              required
              disabled={isSubmitting}
            />
            <input
              className={styles.ex_input}
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => update("ends_at", e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className={`${styles.ex_group} ${styles.ex_organizer}`}>
          <label className={styles.ex_label}>รหัสกิจกรรม (ถ้ามี)</label>
          <input
            className={styles.ex_input}
            type="number"
            min={1}
            placeholder="กรอกรหัสกิจกรรม"
            value={form.staff_user_id ?? ""}
            onChange={(e) =>
              update("staff_user_id", e.target.value ? e.target.value : null)
            }
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
            onChange={(e) => update("file", e.target.files?.[0])}
            disabled={isSubmitting}
          />
          <p className={styles.ex_fileName} aria-live="polite">
            {displayedPosterName}
          </p>
        </div>

        <div className={`${styles.ex_group} ${styles.ex_details}`}>
          <label className={styles.ex_label}>รายละเอียด</label>
          <div
            className={styles.ex_editor}
            data-readonly={isSubmitting ? "true" : "false"}
          >
            <div ref={quillElRef} aria-label="รายละเอียดกิจกรรม" />
          </div>
        </div>
      </div>

      {canSubmit && renderedFooter}
    </form>
  );
});

export default UnitForm;
