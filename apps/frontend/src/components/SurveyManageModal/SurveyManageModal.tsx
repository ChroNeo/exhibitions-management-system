import { ChevronRight, FileText, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useSurveyQuestions } from "../../pages/Survey/hooks";
import styles from "./SurveyManageModal.module.css";

interface SurveyManageModalProps {
  exhibitionId: string;
  onClose: () => void;
}

export default function SurveyManageModal({
  exhibitionId,
  onClose,
}: SurveyManageModalProps) {
  const navigate = useNavigate();

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

  const handleCreateOrEdit = (type: "EXHIBITION" | "UNIT") => {
    const hasSurvey =
      type === "EXHIBITION" ? hasExhibitionSurvey : hasUnitSurvey;

    if (hasSurvey) {
      // Edit mode
      navigate(`/survey/create/${exhibitionId}?edit=true&type=${type}`);
    } else {
      // Create mode - also pass type so user doesn't have to select
      navigate(`/survey/create/${exhibitionId}?type=${type}`);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
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
            onClick={onClose}
            type="button"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
