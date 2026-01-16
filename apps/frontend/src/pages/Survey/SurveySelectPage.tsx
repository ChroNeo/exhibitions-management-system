import { useNavigate } from "react-router-dom";
import { useExhibitionSurveyList } from "./hooks";
import { toFileUrl } from "../../utils/url";
import styles from "./SurveySelect.module.css";

export default function SurveySelectPage() {
  const navigate = useNavigate();
  const { state, refetch } = useExhibitionSurveyList();

  const handleExhibitionClick = (exhibitionId: number) => {
    navigate(`/survey/exhibitions?ex_id=${exhibitionId}`);
  };

  return (
    <div className={styles.container}>
      <h1>Select Exhibition for Survey</h1>
      <p>กรุณาเลือกงานที่ต้องการทำแบบสอบถาม</p>

      {state.status === "initializing" && (
        <div className={styles.statusMessage}>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      {state.status === "not_logged_in" && (
        <div className={styles.statusMessage}>
          <p>Loading login...</p>
        </div>
      )}

      {state.status === "loading" && (
        <div className={styles.statusMessage}>
          <div className="spinner"></div>
          <p>Loading your exhibitions...</p>
        </div>
      )}

      {state.status === "error" && (
        <div className={styles.statusMessage}>
          <div className={styles.errorIcon}>🚫</div>
          <h3 className={styles.errorTitle}>Error</h3>
          <p className={styles.errorMessage}>
            {state.message}
          </p>
          <button
            onClick={refetch}
            className={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      )}

      {state.status === "success" && (
        <>
          {state.data.length > 0 ? (
            <div className={styles.exhibitionList}>
              {state.data.map((exhibition) => (
                <div
                  key={exhibition.exhibition_id}
                  onClick={() =>
                    handleExhibitionClick(exhibition.exhibition_id)
                  }
                  className={styles.exhibitionCard}
                >
                  <div className={styles.exhibitionContent}>
                    {exhibition.picture_path && (
                      <img
                        src={toFileUrl(exhibition.picture_path)}
                        alt={exhibition.title}
                        className={styles.exhibitionImage}
                      />
                    )}
                    <div className={styles.exhibitionDetails}>
                      <div className={styles.exhibitionHeader}>
                        <h3 className={styles.exhibitionTitle}>
                          {exhibition.title}
                        </h3>
                        {exhibition.survey_completed === 1 && (
                          <span className={styles.completedBadge}>
                            ✓ ทำแล้ว
                          </span>
                        )}
                      </div>
                      {exhibition.location && (
                        <p className={styles.exhibitionLocation}>
                          📍 {exhibition.location}
                        </p>
                      )}
                      <p className={styles.exhibitionDate}>
                        📅{" "}
                        {new Date(exhibition.start_date).toLocaleDateString()} -{" "}
                        {new Date(exhibition.end_date).toLocaleDateString()}
                      </p>
                      <p
                        className={`${styles.exhibitionAction} ${
                          exhibition.survey_completed === 1
                            ? styles.exhibitionActionCompleted
                            : styles.exhibitionActionPending
                        }`}
                      >
                        {exhibition.survey_completed === 1
                          ? "คลิกเพื่อดูรายละเอียด →"
                          : "คลิกเพื่อทำแบบสอบถาม →"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyMessage}>
              <p>คุณยังไม่ได้ลงทะเบียนงานใดๆ</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
