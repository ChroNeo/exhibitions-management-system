// components/units/UnitForm.tsx
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MutableRefObject, ReactNode, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import type QuillType from "quill";
import Swal from "sweetalert2";
import styles from "../exhibition/form/ExManageForm.module.css";
import Select, { type MultiValue, type StylesConfig } from "react-select";
import FormButtons from "../Detail/FormButtons";
import { initializeRichTextEditor } from "../../utils/quill";
import { toDeltaObject, toDeltaString } from "../../utils/quillDelta";
import { useUserOptions } from "../../hook/useUserOptions";
import { FaRegFilePdf } from "react-icons/fa6";

export type UnitFormValues = {
  name: string;
  type: "booth" | "activity";
  starts_at: string;
  ends_at: string;
  staff_user_ids: number[];
  description?: string;
  description_delta: string;
  file?: File;
  detailPdfFile?: File;
  detailPdfRemoved: boolean;
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
  initialDetailPdfName?: string;
};

const EMPTY: UnitFormValues = {
  name: "",
  type: "activity",
  starts_at: "",
  ends_at: "",
  staff_user_ids: [],
  description_delta: "",
  file: undefined,
  detailPdfFile: undefined,
  detailPdfRemoved: false,
};

type QuillSource = "user" | "api" | "silent";
type DeltaLike = { ops: unknown[] };
type TextChangeHandler = (
  delta: DeltaLike,
  oldDelta: DeltaLike,
  source: QuillSource
) => void;
type StaffSelectOption = { value: number; label: string };


const storageKey = (
  exId?: string | number,
  unitId?: string | number,
  mode?: Props["mode"]
) =>
  `ems:unit:draft:v1:${exId ?? "no-ex"}:${unitId ?? `new-${mode ?? "create"}`}`;

function normalizeStaffIds(source: unknown): number[] {
  if (Array.isArray(source)) {
    return Array.from(
      new Set(
        source
          .map((value) => Number(value))
          .filter((id) => Number.isFinite(id) && Number.isInteger(id) && id > 0)
      )
    );
  }
  if (typeof source === "number" && Number.isFinite(source) && source > 0) {
    return [source];
  }
  if (typeof source === "string") {
    const trimmed = source.trim();
    if (!trimmed) return [];
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && Number.isInteger(parsed) && parsed > 0
      ? [parsed]
      : [];
  }
  return [];
}

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
    initialDetailPdfName,
  }: Props,
  ref
) {
  const [form, setForm] = useState<UnitFormValues>(() => ({
    ...EMPTY,
    ...initialValues,
    staff_user_ids: normalizeStaffIds(initialValues?.staff_user_ids),
  }));
  const quillElRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<QuillType | null>(null);
  const [quillReady, setQuillReady] = useState(false);
  const detailPdfInputRef = useRef<HTMLInputElement | null>(null);
  const {
    data: staffOptions = [],
    isLoading: isStaffLoading,
  } = useUserOptions("staff");
  const staffSelectOptions = useMemo(
    () => staffOptions.map((option) => ({ value: option.value, label: option.label })),
    [staffOptions]
  );
  const selectedStaffOptions = useMemo(
    () =>
      staffSelectOptions.filter((option) =>
        form.staff_user_ids?.includes(option.value)
      ),
    [staffSelectOptions, form.staff_user_ids]
  );

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
  const hasInitialDetailPdf = Boolean(initialDetailPdfName);

  const handleDetailPdfChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      setForm((prev) => ({
        ...prev,
        detailPdfFile: file,
        detailPdfRemoved: file ? false : prev.detailPdfRemoved,
      }));
    },
    []
  );

  const handleDetailPdfRemove = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      detailPdfFile: undefined,
      detailPdfRemoved: prev.detailPdfFile
        ? false
        : hasInitialDetailPdf
          ? true
          : false,
    }));
    if (detailPdfInputRef.current) {
      detailPdfInputRef.current.value = "";
    }
  }, [hasInitialDetailPdf]);

  const staffSelectStyles: StylesConfig<StaffSelectOption, true> = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        borderRadius: 10,
        borderColor: state.isFocused ? "#c7571f" : "#de6424",
        boxShadow: state.isFocused ? "0 0 0 2px rgba(199, 87, 31, 0.2)" : "none",
        minHeight: 44,
        ":hover": {
          borderColor: "#c7571f",
        },
      }),
      multiValue: (base) => ({
        ...base,
        backgroundColor: "#fde8db",
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: "#7f2d08",
        fontWeight: 600,
      }),
      multiValueRemove: (base) => ({
        ...base,
        color: "#7f2d08",
        ":hover": {
          backgroundColor: "#fbd4b8",
          color: "#7f2d08",
        },
      }),
      valueContainer: (base) => ({
        ...base,
        padding: "4px 8px",
        gap: 4,
      }),
      placeholder: (base) => ({
        ...base,
        color: "#9ca3af",
      }),
      option: (base, state) => ({
        ...base,
        fontWeight: state.isSelected ? 700 : 500,
        backgroundColor: state.isSelected
          ? "#fde8db"
          : state.isFocused
          ? "#fff3ea"
          : base.backgroundColor,
        color: "#1f2937",
      }),
      indicatorSeparator: () => ({
        display: "none",
      }),
      dropdownIndicator: (base) => ({
        ...base,
        color: "#c7571f",
        ":hover": {
          color: "#c7571f",
        },
      }),
      menu: (base) => ({
        ...base,
        zIndex: 20,
      }),
    }),
    []
  );

  const handleStaffChange = useCallback(
    (selected: MultiValue<StaffSelectOption>) => {
      const ids = normalizeStaffIds(selected.map((option) => option.value));
      update("staff_user_ids", ids);
    },
    [update]
  );

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
        staff_user_ids: normalizeStaffIds(initialValues?.staff_user_ids),
        description_delta: JSON.stringify(clip),
      }));
      return;
    }

    quill.setContents(deltaObj, "silent");
    setForm((p) => ({
      ...p,
      ...EMPTY,
      ...initialValues,
      staff_user_ids: normalizeStaffIds(initialValues?.staff_user_ids),
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
        if (
          draft.form &&
          !Array.isArray((draft.form as Record<string, unknown>)['staff_user_ids']) &&
          (draft.form as Record<string, unknown>)['staff_user_id'] !== undefined
        ) {
          const legacy =
            (draft.form as Record<string, unknown>)['staff_user_id'];
          const coerced =
            typeof legacy === "number"
              ? [legacy]
              : typeof legacy === "string" && legacy.trim().length
              ? [Number(legacy)]
              : [];
          (draft.form as Record<string, unknown>)['staff_user_ids'] = coerced.filter(
            (id) => Number.isFinite(id) && Number(id) > 0
          );
          delete (draft.form as Record<string, unknown>)['staff_user_id'];
        }
        if (
          draft.form &&
          Array.isArray(
            (draft.form as Record<string, unknown>)['staff_user_ids']
          )
        ) {
          (draft.form as Record<string, unknown>)['staff_user_ids'] = (
            ((draft.form as Record<string, unknown>)['staff_user_ids'] as unknown[])
          )
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id) && id > 0);
        }
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
          staff_user_ids: normalizeStaffIds(form.staff_user_ids),
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
    form.staff_user_ids,
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

  const detailPdfBadgeName = useMemo(() => {
    if (form.detailPdfFile) return form.detailPdfFile.name;
    if (!form.detailPdfRemoved && initialDetailPdfName) return initialDetailPdfName;
    return undefined;
  }, [form.detailPdfFile, form.detailPdfRemoved, initialDetailPdfName]);

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
          <label className={styles.ex_label}>
            เลือกผู้ดูแล (เลือกได้หลายคน)
          </label>
          <Select
            classNamePrefix="unitStaffSelect"
            options={staffSelectOptions}
            value={selectedStaffOptions}
            isLoading={isStaffLoading}
            isClearable
            isMulti
            isDisabled={isSubmitting}
            closeMenuOnSelect={false}
            placeholder="เลือกผู้ดูแล"
            noOptionsMessage={() => "ไม่พบผู้ใช้"}
            styles={staffSelectStyles}
            onChange={handleStaffChange}
            menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            menuPosition="fixed"
          />
          {isStaffLoading && (
            <p className={styles.ex_fileName} aria-live="polite">
              กำลังโหลดรายชื่อผู้ดูแล...
            </p>
          )}
          {!isStaffLoading && staffSelectOptions.length === 0 && (
            <p className={styles.ex_fileName} role="note">
              ยังไม่มีผู้ใช้ที่สามารถเลือกได้
            </p>
          )}
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

        <div className={`${styles.ex_group} ${styles.ex_file}`}>
          <label className={styles.ex_label} htmlFor="unit-detail-pdf-input">
            อัปโหลดไฟล์รายละเอียด (PDF)
          </label>
          <input
            id="unit-detail-pdf-input"
            className={styles.ex_input}
            type="file"
            accept="application/pdf"
            ref={detailPdfInputRef}
            onChange={handleDetailPdfChange}
            disabled={isSubmitting}
          />
          {detailPdfBadgeName ? (
            <div className={styles.ex_fileBadge} aria-live="polite">
              <FaRegFilePdf className={styles.ex_fileBadgeIcon} aria-hidden="true" />
              <span className={styles.ex_fileBadgeName}>{detailPdfBadgeName}</span>
              {canSubmit ? (
                <button
                  type="button"
                  className={styles.ex_fileBadgeRemove}
                  onClick={handleDetailPdfRemove}
                  disabled={isSubmitting}
                  aria-label="ลบไฟล์รายละเอียด"
                >
                  &times;
                </button>
              ) : null}
            </div>
          ) : (
            <p className={styles.ex_fileName} aria-live="polite">
              ยังไม่ได้เลือกไฟล์
            </p>
          )}
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
