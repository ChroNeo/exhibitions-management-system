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

import styles from "./ExManageForm.module.css";
import FormButtons from "../../DetailButton/FormButtons";
import { initializeRichTextEditor } from "../../../utils/quill";
import { toDeltaObject, toDeltaString } from "../../../utils/quillDelta";

const DEFAULT_STATUS = "draft" as const;
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  ongoing: "Ongoing",
  ended: "Ended",
  archived: "Archived",
};
const EDITABLE_STATUS_VALUES = ["draft", "published", "archived"] as const;

type QuillSource = "user" | "api" | "silent";
type DeltaLike = { ops: unknown[] };
type TextChangeHandler = (
  delta: DeltaLike,
  oldDelta: DeltaLike,
  source: QuillSource
) => void;

export type ExhibitionFormValues = {
  title: string;
  start_date: string;     // datetime-local string
  end_date: string;       // datetime-local string
  location: string;
  organizer_name: string;
  description?: string;   // สร้างตอน submit
  description_delta: string; // single source of truth
  status: string;
  file?: File;
};

type Props = {
  mode: "view" | "edit" | "create";
  exhibitionId?: string | number;
  initialValues?: Partial<ExhibitionFormValues> & { updated_at?: string | null };
  initialFileName?: string;
  readOnly?: boolean;
  onSubmit?: (v: ExhibitionFormValues) => Promise<void> | void;
  footer?: ReactNode;
  preferDraft?: boolean; // ให้ draft ชนะ API ไหม (ค่าเริ่มต้น false)
};

type Draft = {
  version: 1;
  exhibitionId?: string | number;
  savedAt: number;
  form: Pick<
    ExhibitionFormValues,
    "title" | "start_date" | "end_date" | "location" | "organizer_name" | "status"
  >;
  description_delta: string;
};

const EMPTY: ExhibitionFormValues = {
  title: "",
  start_date: "",
  end_date: "",
  location: "",
  organizer_name: "",
  description_delta: "",
  status: DEFAULT_STATUS,
  file: undefined,
};

const storageKey = (exhibitionId?: string | number, mode?: Props["mode"]) =>
  `ems:exhibition:draft:v1:${exhibitionId ?? `new-${mode ?? "create"}`}`;

// helper: ISO -> datetime-local
const isoToLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const ExhibitionForm = forwardRef<HTMLFormElement, Props>(function ExhibitionForm(
  {
    mode,
    exhibitionId,
    initialValues,
    initialFileName,
    readOnly = false,
    onSubmit,
    footer,
    preferDraft = false,
  }: Props,
  ref
) {
  const [form, setForm] = useState<ExhibitionFormValues>({ ...EMPTY, ...initialValues });
  const quillElRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<QuillType | null>(null);
  const [quillReady, setQuillReady] = useState(false);
  const hydratedRef = useRef<"none" | "server" | "draft">("none");

  const navigate = useNavigate();
  const canSubmit = mode === "edit" || mode === "create";
  const disabled = !!readOnly;

  const update = <K extends keyof ExhibitionFormValues>(k: K, v: ExhibitionFormValues[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // init quill
  useEffect(() => {
    if (!quillElRef.current || quillRef.current) return;

    const { quill, cleanup } = initializeRichTextEditor({
      container: quillElRef.current,
      placeholder: "รายละเอียดเพิ่มเติมของนิทรรศการ",
    });

    const handleTextChange: TextChangeHandler = (_d, _o, source) => {
      if (source !== "user") return;
      const deltaString = JSON.stringify(quill.getContents());
      setForm((p) =>
        p.description_delta === deltaString ? p : { ...p, description_delta: deltaString }
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

  // hydrate from API (server wins by default)
  useEffect(() => {
    const quill = quillRef.current;
    if (!quillReady || !quill) return;
    if (hydratedRef.current !== "none") return;

    // normalize start/end for inputs if callerยังไม่ได้แปลง
    const normStart = form.start_date || isoToLocalInput(initialValues?.start_date);
    const normEnd = form.end_date || isoToLocalInput(initialValues?.end_date);

    // if server has only HTML (rare), convert once
    if (
      (!initialValues?.description_delta || toDeltaString(initialValues?.description_delta) === "") &&
      initialValues?.description
    ) {
      const clip = quill.clipboard.convert({ html: initialValues.description });
      quill.setContents(clip, "silent");
      setForm((p) => ({
        ...p,
        ...EMPTY,
        ...initialValues,
        start_date: normStart,
        end_date: normEnd,
        description_delta: JSON.stringify(clip),
      }));
      hydratedRef.current = "server";
      return;
    }

    // server has delta (string or object)
    const deltaObj = toDeltaObject(initialValues?.description_delta);
    quill.setContents(deltaObj, "silent");
    setForm((p) => ({
      ...p,
      ...EMPTY,
      ...initialValues,
      start_date: normStart,
      end_date: normEnd,
      description_delta: toDeltaString(initialValues?.description_delta),
    }));
    hydratedRef.current = "server";
  }, [mode, initialValues, quillReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // optional: hydrate from draft if allowed and newer
  useEffect(() => {
    const quill = quillRef.current;
    if (!quillReady || !quill) return;

    const allowDraft = canSubmit && preferDraft;
    if (!allowDraft) return;
    if (hydratedRef.current === "draft") return; // applied already

    const key = storageKey(exhibitionId, mode);
    const raw = localStorage.getItem(key);
    if (!raw) return;

    try {
      const draft: Draft = JSON.parse(raw);
      const sameScope = draft.version === 1 && draft.exhibitionId === exhibitionId;
      if (!sameScope) return;

      const serverUpdatedAt = initialValues?.updated_at
        ? new Date(initialValues.updated_at).getTime()
        : 0;
      if (serverUpdatedAt && draft.savedAt <= serverUpdatedAt) return;

      const deltaObj = toDeltaObject(draft.description_delta);
      quill.setContents(deltaObj, "silent");
      setForm((p) => ({
        ...p,
        ...EMPTY,
        ...initialValues,
        ...draft.form,
        description_delta: toDeltaString(draft.description_delta),
      }));
      hydratedRef.current = "draft";
    } catch {
      /* ignore */
    }
  }, [exhibitionId, mode, initialValues, canSubmit, preferDraft, quillReady]);

  // warn before unload if draft exists
  useEffect(() => {
    if (!canSubmit) return;
    const key = storageKey(exhibitionId, mode);
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (localStorage.getItem(key)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [exhibitionId, mode, canSubmit]);

  // disable editor + hide toolbar when readOnly
  useEffect(() => {
    const quill = quillRef.current;
    if (!quillReady || !quill) return;
    quill.enable(!disabled);

    type QuillToolbarModule = { container?: HTMLElement };
    const toolbarModule = quill.getModule("toolbar") as QuillToolbarModule | undefined;
    const toolbar = toolbarModule?.container;
    if (toolbar) toolbar.style.display = disabled ? "none" : "";
  }, [disabled, quillReady]);

  // autosave draft (debounced)
  useEffect(() => {
    if (!canSubmit) return;
    const quill = quillRef.current;
    if (!quillReady || !quill) return;

    const key = storageKey(exhibitionId, mode);
    let t: number | null = null;

    const saveDraft = () => {
      const payload: Draft = {
        version: 1,
        exhibitionId,
        savedAt: Date.now(),
        form: {
          title: form.title,
          start_date: form.start_date,
          end_date: form.end_date,
          location: form.location,
          organizer_name: form.organizer_name,
          status: form.status,
        },
        description_delta: JSON.stringify(quill.getContents()),
      };
      localStorage.setItem(key, JSON.stringify(payload));
    };

    const onText: TextChangeHandler = (_d, _o, source) => {
      if (source !== "user") return;
      if (t) window.clearTimeout(t);
      t = window.setTimeout(saveDraft, 400);
    };

    quill.on("text-change", onText);

    // also save when non-editor fields change
    if (t) window.clearTimeout(t);
    t = window.setTimeout(saveDraft, 400);

    return () => {
      quill.off("text-change", onText);
      if (t) window.clearTimeout(t);
    };
  }, [
    form.title,
    form.start_date,
    form.end_date,
    form.location,
    form.organizer_name,
    form.status,
    exhibitionId,
    mode,
    canSubmit,
    quillReady,
  ]);

  // remove draft helper
  const removeDraft = useCallback(() => {
    localStorage.removeItem(storageKey(exhibitionId, mode));
  }, [exhibitionId, mode]);

  const displayedFileName = useMemo(() => {
    if (form.file) return form.file.name;
    if (initialFileName) return initialFileName;
    return "ยังไม่ได้เลือกไฟล์";
  }, [form.file, initialFileName]);

  const statusOptions = useMemo(() => {
    const base = mode === "edit" ? EDITABLE_STATUS_VALUES : [DEFAULT_STATUS];
    const values = [...base] as string[];
    if (form.status && !values.includes(form.status)) values.push(form.status);
    return values.map((value) => ({ value, label: STATUS_LABELS[value] ?? value }));
  }, [mode, form.status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !onSubmit) return;

    const quill = quillRef.current;
    const html = quill ? quill.root.innerHTML : "";
    const deltaStr = quill ? JSON.stringify(quill.getContents()) : "";

    const payload: ExhibitionFormValues = {
      ...form,
      description: html === "<p><br></p>" ? "" : html,
      description_delta: deltaStr,
    };

    await onSubmit(payload);
    removeDraft();
  };

  // ref for external submit
  const formRef = useRef<HTMLFormElement>(null);
  const setFormRef = useCallback(
    (node: HTMLFormElement | null) => {
      formRef.current = node;
      if (!ref) return;
      if (typeof ref === "function") ref(node);
      else (ref as MutableRefObject<HTMLFormElement | null>).current = node;
    },
    [ref]
  );

  return (
    <form ref={setFormRef} className={styles.formRoot} onSubmit={handleSubmit}>
      <div className={styles.ex_card}>
        <div className={`${styles.ex_group} ${styles.ex_name}`}>
          <label className={styles.ex_label}>ชื่องานนิทรรศการ</label>
          <input
            className={styles.ex_input}
            type="text"
            placeholder="เช่น Smart Tech Expo"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className={styles.ex_group}>
          <label className={styles.ex_label}>สถานะ</label>
          <select
            className={styles.ex_input}
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            disabled={disabled || mode === "create"}
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className={`${styles.ex_group} ${styles.ex_date}`}>
          <label className={styles.ex_label}>ช่วงเวลา</label>
          <div className={styles.ex_dates}>
            
            <input
              className={styles.ex_input}
              type="datetime-local"
              value={form.start_date}
              onChange={(e) => update("start_date", e.target.value)}
              disabled={disabled}
            />
            <input
              className={styles.ex_input}
              type="datetime-local"
              value={form.end_date}
              onChange={(e) => update("end_date", e.target.value)}
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
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className={`${styles.ex_group} ${styles.ex_file}`}>
          <label className={styles.ex_label}>ไฟล์รูปภาพ (ถ้ามี)</label>
          <input
            className={styles.ex_input}
            type="file"
            onChange={(e) => update("file", e.target.files?.[0])}
            disabled={disabled}
          />
          <p className={styles.ex_fileName} aria-live="polite">{displayedFileName}</p>
        </div>

        <div className={`${styles.ex_group} ${styles.ex_organizer}`}>
          <label className={styles.ex_label}>ผู้จัดงาน</label>
          <input
            className={styles.ex_input}
            type="text"
            placeholder="ชื่อหน่วยงาน/บริษัท"
            value={form.organizer_name}
            onChange={(e) => update("organizer_name", e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className={`${styles.ex_group} ${styles.ex_details}`}>
          <label className={styles.ex_label}>รายละเอียด</label>
          <div className={styles.ex_editor} data-readonly={disabled ? "true" : "false"}>
            <div ref={quillElRef} aria-label="รายละเอียดเพิ่มเติมของนิทรรศการ" />
          </div>
        </div>
      </div>

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
