import DOMPurify from "dompurify";
import { X } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaRegFilePdf } from "react-icons/fa6";
import { IoLocationOutline, IoPersonOutline } from "react-icons/io5";
import { LuBadgeCheck, LuCamera, LuClock } from "react-icons/lu";
import { MdOutlineCalendarToday } from "react-icons/md";
import { Link } from "react-router-dom";
import { toThaiDate, toThaiTimeRange } from "../../utils/dateFormat";
import styles from "./ExhibitionDetailCard.module.css";

const STATUS_OPTIONS = [
  { value: "draft", label: "ร่าง" },
  { value: "published", label: "เผยแพร่" },
  { value: "ongoing", label: "กำลังจัด" },
  { value: "ended", label: "จบงาน" },
  { value: "archived", label: "เก็บ" },
];

export type EditFormState = {
  title: string;
  start_date: string;
  end_date: string;
  location: string;
  organizer_name: string;
  status: string;
  file?: File;
  detailPdfFile?: File;
  detailPdfRemoved?: boolean;
};

type Props = {
  title: string;
  startISO?: string;
  endISO?: string;
  startText?: string;
  endText?: string;
  timeText?: string;
  location?: string;
  organizer?: string;
  description?: string;
  descriptionHtml?: string;
  imageUrl?: string;
  detailPdfUrl?: string;
  status?: string;
  registerLink?: string;
  // Edit mode
  isEditing?: boolean;
  editForm?: EditFormState;
  imagePreview?: string;
  initialDetailPdfName?: string;
  quillContainerRef?: RefObject<HTMLDivElement | null>;
  onFieldChange?: (field: string, value: string) => void;
  onFileChange?: (file: File | undefined) => void;
  onPdfFileChange?: (file: File | undefined) => void;
  onPdfFileRemove?: () => void;
  onSave?: () => void;
  onCancelEdit?: () => void;
  // Action bar (view mode)
  actionBar?: ReactNode;
};

export default function ExhibitionDetailCard({
  title,
  startISO,
  endISO,
  startText,
  endText,
  timeText,
  location,
  organizer,
  description,
  descriptionHtml,
  imageUrl,
  detailPdfUrl,
  status,
  registerLink,
  isEditing = false,
  editForm,
  imagePreview,
  initialDetailPdfName,
  quillContainerRef,
  onFieldChange,
  onFileChange,
  onPdfFileChange,
  onPdfFileRemove,
  onSave,
  onCancelEdit,
  actionBar,
}: Props) {
  const hasDescriptionHtml =
    typeof descriptionHtml === "string" && descriptionHtml.trim().length > 0;
  const hasDescriptionText =
    typeof description === "string" && description.trim().length > 0;

  const startDateStr = startISO ? toThaiDate(startISO) : startText;
  const endDateStr = endISO ? toThaiDate(endISO) : endText;
  const timeLine =
    startISO && endISO ? toThaiTimeRange(startISO, endISO) : timeText;

  const displayImage = isEditing && imagePreview ? imagePreview : imageUrl;

  const [lightboxOpen, setLightboxOpen] = useState(false);

  const openLightbox = useCallback(() => {
    if (!isEditing && displayImage) setLightboxOpen(true);
  }, [isEditing, displayImage]);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, closeLightbox]);

  const cardClass = `${styles.card} ${isEditing ? styles.editing : ""}`;

  return (
    <>
      <section className={cardClass}>
        <div className={styles.layout}>
          {/* Left: Image */}
          <div className={styles.imageSection}>
            {displayImage && (
              <img
                src={displayImage}
                alt={title}
                className={`${styles.image} ${!isEditing ? styles.imageClickable : ""}`}
                onClick={openLightbox}
              />
            )}

            {/* Status badge - view only */}
            {!isEditing && status && (
              <div className={styles.statusBadge}>
                <span className={styles.statusDot} />
                {status}
              </div>
            )}

            {/* Image edit overlay */}
            {isEditing && (
              <div className={styles.imageOverlay}>
                <div className={styles.imageOverlayCard}>
                  <span className={styles.imageOverlayLabel}>
                    เปลี่ยนรูปภาพปก
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={(e) => onFileChange?.(e.target.files?.[0])}
                  />
                  <p className={styles.imageOverlayHint}>
                    <LuCamera size={12} /> เลือกรูปภาพที่ต้องการแสดง
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Content */}
          <div className={styles.content}>
            {/* Title & Organizer */}
            <div className={styles.titleBlock}>
              {isEditing && editForm ? (
                <>
                  <label className={styles.editLabel}>ชื่องานนิทรรศการ</label>
                  <input
                    type="text"
                    className={`${styles.editInput} ${styles.editInputTitle}`}
                    value={editForm.title}
                    onChange={(e) => onFieldChange?.("title", e.target.value)}
                  />
                </>
              ) : (
                <h2 className={styles.title}>{title}</h2>
              )}

              <div className={styles.organizer}>
                <IoPersonOutline
                  size={16}
                  style={isEditing ? { color: "#3b82f6" } : undefined}
                />
                {isEditing && editForm ? (
                  <input
                    type="text"
                    className={`${styles.editInput} ${styles.editInputOrganizer}`}
                    value={editForm.organizer_name}
                    onChange={(e) =>
                      onFieldChange?.("organizer_name", e.target.value)
                    }
                    placeholder="ชื่อผู้จัดงาน"
                  />
                ) : (
                  organizer && <span>{organizer}</span>
                )}
              </div>
            </div>

            <hr className={styles.divider} />

            {/* Info Grid - 2 columns */}
            <div className={styles.infoGrid}>
              {/* Date */}
              <div className={styles.infoItem}>
                <div className={`${styles.iconframe} ${styles.iconBlue}`}>
                  <MdOutlineCalendarToday size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className={styles.infoLabel}>วันที่จัดงาน</p>
                  {isEditing && editForm ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        marginTop: 4,
                      }}
                    >
                      <input
                        type="datetime-local"
                        className={styles.editInput}
                        value={editForm.start_date}
                        onChange={(e) =>
                          onFieldChange?.("start_date", e.target.value)
                        }
                      />
                      <input
                        type="datetime-local"
                        className={styles.editInput}
                        value={editForm.end_date}
                        onChange={(e) =>
                          onFieldChange?.("end_date", e.target.value)
                        }
                      />
                    </div>
                  ) : (
                    <>
                      <p className={styles.infoValue}>{startDateStr}</p>
                      {endDateStr && (
                        <p className={styles.infoSub}>ถึง {endDateStr}</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Time - view only (derived from dates) */}
              {!isEditing && timeLine && (
                <div className={styles.infoItem}>
                  <div className={`${styles.iconframe} ${styles.iconOrange}`}>
                    <LuClock size={20} />
                  </div>
                  <div>
                    <p className={styles.infoLabel}>เวลา</p>
                    <p className={styles.infoValue}>{timeLine}</p>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className={styles.infoItem}>
                <div className={`${styles.iconframe} ${styles.iconGreen}`}>
                  <LuBadgeCheck size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className={styles.infoLabel}>สถานะ</p>
                  {isEditing && editForm ? (
                    <select
                      className={styles.editSelect}
                      value={editForm.status}
                      onChange={(e) =>
                        onFieldChange?.("status", e.target.value)
                      }
                      style={{ marginTop: 4 }}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    status && <p className={styles.infoValue}>{status}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className={`${styles.infoItem} ${styles.infoFull}`}>
                <div className={`${styles.iconframe} ${styles.iconRed}`}>
                  <IoLocationOutline size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className={styles.infoLabel}>สถานที่</p>
                  {isEditing && editForm ? (
                    <input
                      type="text"
                      className={styles.editInput}
                      value={editForm.location}
                      onChange={(e) =>
                        onFieldChange?.("location", e.target.value)
                      }
                      style={{ marginTop: 4 }}
                    />
                  ) : (
                    location && <p className={styles.infoValue}>{location}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {isEditing ? (
              <>
                <div className={`${styles.descBox} ${styles.descBoxEditing}`}>
                  <h3 className={styles.descTitle}>
                    รายละเอียด{" "}
                    <span className={styles.descEditHint}>(แก้ไข)</span>
                  </h3>
                  <div className={styles.editorWrap}>
                    <div ref={quillContainerRef} />
                  </div>
                </div>
                <div className={styles.descBox} style={{ marginTop: 16 }}>
                  <h3 className={styles.descTitle}>
                    ไฟล์รายละเอียด PDF{" "}
                    <span className={styles.descEditHint}>(ถ้ามี)</span>
                  </h3>

                  {editForm?.detailPdfFile ||
                  (initialDetailPdfName && !editForm?.detailPdfRemoved) ? (
                    <div style={{ position: "relative", marginTop: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "12px 14px",
                          border: "1.5px solid #cbd5e1",
                          borderRadius: "8px",
                          background: "#fff",
                        }}
                      >
                        <FaRegFilePdf size={20} style={{ color: "#3b82f6" }} />
                        <span
                          style={{
                            fontSize: 13,
                            color: "#334155",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontWeight: 500,
                          }}
                        >
                          {editForm?.detailPdfFile?.name ||
                            initialDetailPdfName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onPdfFileRemove}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: "rgba(0, 0, 0, 0.55)",
                          backdropFilter: "blur(4px)",
                          color: "white",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(220, 50, 50, 0.8)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(0, 0, 0, 0.55)")
                        }
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className={styles.uploadBox}>
                      <input
                        className={styles.uploadInput}
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => onPdfFileChange?.(e.target.files?.[0])}
                      />
                      <div className={styles.uploadIcon}>
                        <svg
                          width="24"
                          height="24"
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
                      <div className={styles.uploadText}>
                        คลิกเพื่อเลือกไฟล์ PDF
                      </div>
                      <div className={styles.uploadHint}>PDF — สูงสุด 10MB</div>
                    </label>
                  )}
                </div>
              </>
            ) : hasDescriptionHtml || hasDescriptionText || detailPdfUrl ? (
              <div className={styles.descBox}>
                <h3 className={styles.descTitle}>รายละเอียด</h3>
                {hasDescriptionHtml ? (
                  <div
                    className={styles.descContent}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(descriptionHtml ?? ""),
                    }}
                  />
                ) : hasDescriptionText ? (
                  <p className={styles.descContent}>{description}</p>
                ) : null}
                {detailPdfUrl && (
                  <a
                    href={detailPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.pdfButton}
                  >
                    <FaRegFilePdf size={16} />
                    เปิดไฟล์รายละเอียด (PDF)
                  </a>
                )}
              </div>
            ) : null}

            {/* Register CTA - view only */}
            {!isEditing && registerLink && (
              <div className={styles.ctaWrap}>
                <Link to={registerLink} className={styles.ctaBtn}>
                  ลงทะเบียนเข้าร่วมงาน
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom action bar */}
        {isEditing ? (
          <div className={`${styles.actionBar} ${styles.actionBarEditing}`}>
            <span
              className={`${styles.actionBarLabel} ${styles.actionBarEditingLabel}`}
            >
              กำลังอยู่ในโหมดแก้ไข
            </span>
            <div className={styles.actionBarButtons}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onCancelEdit}
              >
                ยกเลิก
              </button>
              <button type="button" className={styles.saveBtn} onClick={onSave}>
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </div>
        ) : (
          actionBar && (
            <div className={styles.actionBar}>
              <span className={styles.actionBarLabel}>เครื่องมือจัดการ:</span>
              <div className={styles.actionBarButtons}>{actionBar}</div>
            </div>
          )
        )}
      </section>
      {displayImage &&
        createPortal(
          <div
            className={`${styles.lightbox} ${lightboxOpen ? styles.lightboxOpen : ""}`}
            onClick={closeLightbox}
          >
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={closeLightbox}
              aria-label="ปิด"
            >
              <X size={24} />
            </button>
            <img
              src={displayImage}
              alt={title}
              className={styles.lightboxImage}
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
