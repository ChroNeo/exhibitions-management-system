import { ChevronRight, FileText, Settings2 } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSurveyQuestions } from "../../pages/Survey/hooks";
import styles from "./SurveyManageModal.module.css";

interface SurveyManageModalProps {
  exhibitionId: string;
  onClose: () => void;
}

function SurveyManageModal({ exhibitionId, onClose }: SurveyManageModalProps) {
  const navigate = useNavigate();

  // Entrance: mount in closed state, then transition to open next frame
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setIsOpen(true)));
  }, []);

  // Close: transition out, then unmount via onClose
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && !isOpen) onClose();
    },
    [isOpen, onClose],
  );

  // Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleClose]);

  // Check if surveys exist
  const { data: exhibitionSurveys } = useSurveyQuestions({
    exhibition_id: exhibitionId,
    type: "EXHIBITION",
  });

  const { data: unitSurveys } = useSurveyQuestions({
    exhibition_id: exhibitionId,
    type: "UNIT",
  });

  const hasExhibitionSurvey = exhibitionSurveys && exhibitionSurveys.length > 0;
  const hasUnitSurvey = unitSurveys && unitSurveys.length > 0;

  const handleCreateOrEdit = useCallback(
    (type: "EXHIBITION" | "UNIT") => {
      const hasSurvey =
        type === "EXHIBITION" ? hasExhibitionSurvey : hasUnitSurvey;

      if (hasSurvey) {
        navigate(`/survey/create/${exhibitionId}?edit=true&type=${type}`);
      } else {
        navigate(`/survey/create/${exhibitionId}?type=${type}`);
      }
    },
    [hasExhibitionSurvey, hasUnitSurvey, exhibitionId, navigate],
  );

  return (
    <div
      className={`${styles.overlay}${isOpen ? ` ${styles.overlayOpen}` : ""}`}
      onTransitionEnd={handleTransitionEnd}
      onClick={handleClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Settings2 size={24} className={styles.headerIconSvg} />
          </div>
          <h2 className={styles.headerTitle}>จัดการแบบสอบถาม</h2>
          <p className={styles.headerSubtitle}>
            เลือกแบบสอบถามที่คุณต้องการจัดการหรือแก้ไข
          </p>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.cardButton}
            onClick={() => handleCreateOrEdit("EXHIBITION")}
            type="button"
          >
            <div className={styles.cardMain}>
              <div className={`${styles.cardIcon} ${styles.cardIconBlue}`}>
                <FileText size={20} />
              </div>
              <div className={styles.cardText}>
                <h3 className={styles.cardTitle}>
                  {hasExhibitionSurvey ? "แก้ไข" : "สร้าง"}แบบสอบถามนิทรรศการ
                </h3>
                <p className={styles.cardSubtitle}>
                  สำหรับประเมินความพึงพอใจนิทรรศการ
                </p>
              </div>
            </div>

            <div className={styles.cardRight}>
              {hasExhibitionSurvey && (
                <span className={styles.badge}>
                  <span className={styles.badgeDot} />
                  มีแล้ว
                </span>
              )}
              <ChevronRight size={20} className={styles.chevron} />
            </div>
          </button>

          <button
            className={styles.cardButton}
            onClick={() => handleCreateOrEdit("UNIT")}
            type="button"
          >
            <div className={styles.cardMain}>
              <div className={`${styles.cardIcon} ${styles.cardIconPurple}`}>
                <FileText size={20} />
              </div>
              <div className={styles.cardText}>
                <h3 className={styles.cardTitle}>
                  {hasUnitSurvey ? "แก้ไข" : "สร้าง"}แบบสอบถามบูธ
                </h3>
                <p className={styles.cardSubtitle}>
                  สำหรับประเมินแต่ละบูธในนิทรรศการ
                </p>
              </div>
            </div>

            <div className={styles.cardRight}>
              {hasUnitSurvey && (
                <span className={styles.badge}>
                  <span className={styles.badgeDot} />
                  มีแล้ว
                </span>
              )}
              <ChevronRight size={20} className={styles.chevron} />
            </div>
          </button>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            type="button"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(SurveyManageModal);
