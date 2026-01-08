import { useNavigate } from "react-router-dom";
import { useSurveyQuestions } from "../../hook/useSurveyQuestions";
import styles from "./SurveyManageModal.module.css";

interface SurveyManageModalProps {
  exhibitionId: string;
  onClose: () => void;
}

export default function SurveyManageModal({ exhibitionId, onClose }: SurveyManageModalProps) {
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
    const hasSurvey = type === "EXHIBITION" ? hasExhibitionSurvey : hasUnitSurvey;

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
        <h2 className={styles.title}>จัดการแบบสอบถาม</h2>

        <div className={styles.buttonGroup}>
          <button
            className={styles.surveyButton}
            onClick={() => handleCreateOrEdit("EXHIBITION")}
          >
            <div className={styles.buttonContent}>
              <span className={styles.buttonTitle}>
                {hasExhibitionSurvey ? "แก้ไข" : "สร้าง"}แบบสอบถามนิทรรศการ
              </span>
              <span className={styles.buttonSubtitle}>
                สำหรับประเมินความพึงพอใจนิทรรศการ
              </span>
            </div>
            {hasExhibitionSurvey && (
              <span className={styles.badge}>มีแล้ว</span>
            )}
          </button>

          <button
            className={styles.surveyButton}
            onClick={() => handleCreateOrEdit("UNIT")}
          >
            <div className={styles.buttonContent}>
              <span className={styles.buttonTitle}>
                {hasUnitSurvey ? "แก้ไข" : "สร้าง"}แบบสอบถามบูธ
              </span>
              <span className={styles.buttonSubtitle}>
                สำหรับประเมินแต่ละบูธในนิทรรศการ
              </span>
            </div>
            {hasUnitSurvey && (
              <span className={styles.badge}>มีแล้ว</span>
            )}
          </button>
        </div>

        <button className={styles.closeButton} onClick={onClose}>
          ปิด
        </button>
      </div>
    </div>
  );
}
