import { X } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { optimizeImage } from "../../utils/imageOptimize";
import styles from "./ExManagePage.module.css";

type ModalStatus = "draft" | "active" | "upcoming" | "ended";

const EMPTY_FORM = {
  title: "",
  startDate: "",
  endDate: "",
  location: "",
  organizer: "",
  description: "",
  status: "draft" as ModalStatus | null,
  imagePreview: "",
  imageFile: null as File | null,
  pdfFile: null as File | null,
};

export type ModalFormData = {
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  organizer: string;
  description: string;
  status: ModalStatus | null;
  imageFile: File | null;
  pdfFile: File | null;
};

interface AddExhibitionModalProps {
  open: boolean;
  isCreating: boolean;
  onClose: () => void;
  onSubmit: (form: ModalFormData) => void;
}

function AddExhibitionModal({
  open,
  isCreating,
  onClose,
  onSubmit,
}: AddExhibitionModalProps) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [titleError, setTitleError] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Lazy mount: mount DOM first (invisible), then add open class next frame
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setIsOpen(true)));
    } else {
      setIsOpen(false);
    }
  }, [open]);

  const handleTransitionEnd = useCallback(() => {
    if (!open) setMounted(false);
  }, [open]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM });
      setTitleError(false);
      setTimeout(() => titleRef.current?.focus(), 220);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const updateField = useCallback(
    <K extends keyof typeof EMPTY_FORM>(
      key: K,
      value: (typeof EMPTY_FORM)[K],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const selectStatus = useCallback((s: ModalStatus) => {
    setForm((prev) => ({ ...prev, status: s }));
  }, []);

  const handleImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const optimized = await optimizeImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm((prev) => ({
          ...prev,
          imagePreview: (ev.target?.result as string) ?? "",
          imageFile: optimized,
        }));
      };
      reader.readAsDataURL(optimized);
    },
    [],
  );

  const removeImage = useCallback(() => {
    setForm((prev) => ({ ...prev, imagePreview: "", imageFile: null }));
  }, []);

  const handlePdfChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setForm((prev) => ({ ...prev, pdfFile: file }));
    },
    [],
  );

  const removePdf = useCallback(() => {
    setForm((prev) => ({ ...prev, pdfFile: null }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.title.trim()) {
      setTitleError(true);
      titleRef.current?.focus();
      setTimeout(() => setTitleError(false), 2000);
      return;
    }
    onSubmit(form);
  }, [form, onSubmit]);

  if (!mounted) return null;

  return (
    <div
      ref={overlayRef}
      className={`${styles.modalOverlay}${isOpen ? ` ${styles.modalOverlayOpen}` : ""}`}
      onTransitionEnd={handleTransitionEnd}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        {/* Modal header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>เพิ่มนิทรรศการใหม่</h2>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Modal body */}
        <div className={styles.modalBody}>
          {/* Title */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              ชื่องานนิทรรศการ <span className={styles.req}>*</span>
            </label>
            <input
              ref={titleRef}
              className={`${styles.formInput}${titleError ? ` ${styles.formInputError}` : ""}`}
              type="text"
              placeholder="เช่น AI Technology Expo 2026"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </div>

          {/* Status */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              สถานะ <span className={styles.req}>*</span>
            </label>
            <div className={styles.statusOptions}>
              <button
                type="button"
                className={`${styles.statusOption}${form.status === "draft" ? ` ${styles.statusDraft}` : ""}`}
                onClick={() => selectStatus("draft")}
              >
                <span className={`${styles.sDot} ${styles.sDotDraft}`} />
                ร่าง
              </button>
              <button
                type="button"
                className={`${styles.statusOption}${form.status === "active" ? ` ${styles.statusActive}` : ""}`}
                onClick={() => selectStatus("active")}
              >
                <span className={`${styles.sDot} ${styles.sDotActive}`} />
                กำลังจัด
              </button>
              <button
                type="button"
                className={`${styles.statusOption}${form.status === "upcoming" ? ` ${styles.statusUpcoming}` : ""}`}
                onClick={() => selectStatus("upcoming")}
              >
                <span className={`${styles.sDot} ${styles.sDotUpcoming}`} />
                เผยแพร่
              </button>
              <button
                type="button"
                className={`${styles.statusOption}${form.status === "ended" ? ` ${styles.statusEnded}` : ""}`}
                onClick={() => selectStatus("ended")}
              >
                <span className={`${styles.sDot} ${styles.sDotEnded}`} />
                จบงาน
              </button>
            </div>
          </div>

          <div className={styles.formDivider} />
          <div className={styles.formSectionTitle}>ช่วงเวลา</div>

          {/* Date row */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                วันเริ่มต้น <span className={styles.req}>*</span>
              </label>
              <input
                className={styles.formInput}
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                วันสิ้นสุด <span className={styles.req}>*</span>
              </label>
              <input
                className={styles.formInput}
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formDivider} />
          <div className={styles.formSectionTitle}>รายละเอียด</div>

          {/* Location */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>สถานที่จัดงาน</label>
            <input
              className={styles.formInput}
              type="text"
              placeholder="เช่น Bangkok Convention Center"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
            />
          </div>

          {/* Organizer */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>ผู้จัดงาน</label>
            <input
              className={styles.formInput}
              type="text"
              placeholder="ชื่อผู้จัดงานหรือองค์กร"
              value={form.organizer}
              onChange={(e) => updateField("organizer", e.target.value)}
            />
          </div>

          {/* Image upload */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>ไฟล์รูปภาพ (ถ้ามี)</label>
            {form.imagePreview ? (
              <div className={styles.imgPrevBox}>
                <img
                  className={styles.imgPrev}
                  src={form.imagePreview}
                  alt="preview"
                />
                <button
                  type="button"
                  className={styles.imgRemove}
                  onClick={removeImage}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className={styles.imgUpload}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className={styles.imgUploadInput}
                />
                <div className={styles.uploadIcon}>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M3 14l4-4 3 3 3-4 4 5" />
                    <rect x="1" y="3" width="18" height="14" rx="2" />
                  </svg>
                </div>
                <div className={styles.uploadText}>คลิกหรือลากไฟล์มาวาง</div>
                <div className={styles.uploadHint}>
                  JPG, PNG, WEBP — สูงสุด 5MB
                </div>
              </label>
            )}
          </div>

          {/* PDF upload */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              ไฟล์ PDF รายละเอียด (ถ้ามี)
            </label>
            {form.pdfFile ? (
              <div className={styles.imgPrevBox}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    border: "1.5px solid var(--border)",
                    borderRadius: "var(--radius-xs)",
                    background: "var(--surface-hover)",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0, color: "var(--brand)" }}
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {form.pdfFile.name}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.imgRemove}
                  onClick={removePdf}
                  style={{ top: 8, right: 8 }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className={styles.imgUpload}>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfChange}
                  className={styles.imgUploadInput}
                />
                <div className={styles.uploadIcon}>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className={styles.uploadText}>คลิกเพื่อเลือกไฟล์ PDF</div>
                <div className={styles.uploadHint}>PDF — สูงสุด 10MB</div>
              </label>
            )}
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>รายละเอียด</label>
            <textarea
              className={styles.formTextarea}
              placeholder="รายละเอียดเพิ่มเติมของนิทรรศการ"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>
        </div>

        {/* Modal footer */}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="button"
            className={styles.btnSave}
            onClick={handleSubmit}
            disabled={isCreating}
          >
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M2 7.5l3.5 3.5 7-7" />
            </svg>
            {isCreating ? "กำลังสร้าง..." : "สร้างนิทรรศการ"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(AddExhibitionModal);
