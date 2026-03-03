import type { ReactNode } from "react";
import { useState, useCallback, useEffect } from "react";
import { MdOutlineCalendarToday } from "react-icons/md";
import { LuClock } from "react-icons/lu";
import { FiUser } from "react-icons/fi";
import { BsTag } from "react-icons/bs";
import { FaRegFilePdf } from "react-icons/fa6";
import { X } from "lucide-react";
import cardStyles from "../exhibition/ExhibitionDetailCard.module.css";
import styles from "./UnitDetailCard.module.css";

type Props = {
  title: string;
  dateText: string;
  timeText?: string;
  typeText?: string;
  staffText?: string;
  description?: string;
  descriptionHtml?: string;
  posterUrl?: string;
  detailPdfUrl?: string;
  actionBar?: ReactNode;
};

export default function UnitDetailCard({
  title,
  dateText,
  timeText,
  typeText,
  staffText,
  description,
  descriptionHtml,
  posterUrl,
  detailPdfUrl,
  actionBar,
}: Props) {
  const hasDescriptionHtml =
    typeof descriptionHtml === "string" && descriptionHtml.trim().length > 0;
  const hasDescriptionText =
    typeof description === "string" && description.trim().length > 0;

  const [lightboxOpen, setLightboxOpen] = useState(false);

  const openLightbox = useCallback(() => {
    if (posterUrl) setLightboxOpen(true);
  }, [posterUrl]);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, closeLightbox]);

  return (
    <section className={cardStyles.card}>
      <div className={cardStyles.layout}>
        {/* Left: Image */}
        {posterUrl && (
          <div className={cardStyles.imageSection}>
            <img
              src={posterUrl}
              alt={title}
              className={`${cardStyles.image} ${cardStyles.imageClickable}`}
              onClick={openLightbox}
            />
          </div>
        )}

        {/* Right: Content */}
        <div className={cardStyles.content}>
          <div className={cardStyles.titleBlock}>
            <h2 className={cardStyles.title}>{title}</h2>
          </div>

          <hr className={cardStyles.divider} />

          {/* Info Grid */}
          <div className={cardStyles.infoGrid}>
            {/* Date */}
            <div className={cardStyles.infoItem}>
              <div className={`${cardStyles.iconframe} ${cardStyles.iconBlue}`}>
                <MdOutlineCalendarToday size={20} />
              </div>
              <div>
                <p className={cardStyles.infoLabel}>วันที่จัดกิจกรรม</p>
                <p className={cardStyles.infoValue}>{dateText}</p>
              </div>
            </div>

            {/* Time */}
            {timeText && (
              <div className={cardStyles.infoItem}>
                <div className={`${cardStyles.iconframe} ${cardStyles.iconOrange}`}>
                  <LuClock size={20} />
                </div>
                <div>
                  <p className={cardStyles.infoLabel}>เวลา</p>
                  <p className={cardStyles.infoValue}>{timeText}</p>
                </div>
              </div>
            )}

            {/* Type */}
            {typeText && (
              <div className={cardStyles.infoItem}>
                <div className={`${cardStyles.iconframe} ${cardStyles.iconGreen}`}>
                  <BsTag size={20} />
                </div>
                <div>
                  <p className={cardStyles.infoLabel}>ประเภท</p>
                  <p className={cardStyles.infoValue}>{typeText}</p>
                </div>
              </div>
            )}

            {/* Staff */}
            {staffText && (
              <div className={`${cardStyles.infoItem} ${styles.staffItem}`}>
                <div className={`${cardStyles.iconframe} ${cardStyles.iconRed}`}>
                  <FiUser size={20} />
                </div>
                <div>
                  <p className={cardStyles.infoLabel}>ผู้ดูแล</p>
                  <p className={cardStyles.infoValue}>
                    {staffText.replace(/^ผู้ดูแล: /, "")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Description + PDF */}
          {(hasDescriptionHtml || hasDescriptionText || detailPdfUrl) && (
            <div className={cardStyles.descBox}>
              <h3 className={cardStyles.descTitle}>รายละเอียด</h3>
              {hasDescriptionHtml ? (
                <div
                  className={cardStyles.descContent}
                  dangerouslySetInnerHTML={{ __html: descriptionHtml ?? "" }}
                />
              ) : hasDescriptionText ? (
                <p className={cardStyles.descContent}>{description}</p>
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
          )}
        </div>
      </div>

      {/* Action bar */}
      {actionBar && (
        <div className={cardStyles.actionBar}>
          <span className={cardStyles.actionBarLabel}>เครื่องมือจัดการ:</span>
          <div className={cardStyles.actionBarButtons}>{actionBar}</div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && posterUrl && (
        <div className={cardStyles.lightbox} onClick={closeLightbox}>
          <button
            type="button"
            className={cardStyles.lightboxClose}
            onClick={closeLightbox}
            aria-label="ปิด"
          >
            <X size={24} />
          </button>
          <img
            src={posterUrl}
            alt={title}
            className={cardStyles.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
