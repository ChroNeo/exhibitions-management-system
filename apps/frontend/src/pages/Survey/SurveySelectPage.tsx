import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";
import axios from "axios";
import { getUserExhibitions, type UserTicket } from "../../api/tickets";
import { toFileUrl } from "../../utils/url";
import styles from "./SurveySelect.module.css";

const LIFF_CONFIG = {
  liffId: "2008498720-Sd7gGdIL",
};

type PageState =
  | { status: "initializing" }
  | { status: "not_logged_in" }
  | { status: "loading" }
  | { status: "success"; exhibitions: UserTicket[] }
  | { status: "error"; message: string };

export default function SurveySelectPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>({ status: "initializing" });

  const fetchExhibitions = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const exhibitions = await getUserExhibitions();

      setState({
        status: "success",
        exhibitions,
      });
    } catch (error) {
      // Handle 401 Unauthorized
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setState({ status: "not_logged_in" });
        if (liff.isLoggedIn()) {
          liff.logout();
        }
        liff.login({ redirectUri: window.location.href });
        return;
      }

      let errorMessage = "Failed to load exhibitions";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
          errorMessage = "Cannot reach server.";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState({ status: "error", message: errorMessage });
    }
  }, []);

  const initializeLiff = useCallback(async () => {
    try {
      if (!liff.id) {
        await liff.init({ liffId: LIFF_CONFIG.liffId });
      }

      if (!liff.isLoggedIn()) {
        setState({ status: "not_logged_in" });
        liff.login({ redirectUri: window.location.href });
        return;
      }

      await fetchExhibitions();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "LIFF Init Failed",
      });
    }
  }, [fetchExhibitions]);

  useEffect(() => {
    initializeLiff();
  }, [initializeLiff]);

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
            onClick={fetchExhibitions}
            className={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      )}

      {state.status === "success" && (
        <>
          {state.exhibitions.length > 0 ? (
            <div className={styles.exhibitionList}>
              {state.exhibitions.map((exhibition) => (
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
