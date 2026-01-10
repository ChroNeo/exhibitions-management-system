import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";
import axios from "axios";
import { getCheckedInUnits, type CheckedInUnit } from "../../api/tickets";
import styles from "./UnitList.module.css";

const LIFF_CONFIG = {
  liffId: "2008498720-Sd7gGdIL",
};

type PageState =
  | { status: "initializing" }
  | { status: "not_logged_in" }
  | { status: "loading" }
  | { status: "success"; units: CheckedInUnit[] }
  | { status: "error"; message: string };

export default function UnitListPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>({ status: "initializing" });

  // Get exhibition_id from URL
  const params = new URLSearchParams(window.location.search);
  const exhibitionId = params.get("ex_id");

  const fetchUnits = useCallback(async () => {
    if (!exhibitionId) {
      setState({ status: "error", message: "Exhibition ID is required" });
      return;
    }

    setState({ status: "loading" });

    try {
      const units = await getCheckedInUnits(exhibitionId);

      setState({
        status: "success",
        units,
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

      let errorMessage = "Failed to load units";

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
  }, [exhibitionId]);

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

      await fetchUnits();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "LIFF Init Failed",
      });
    }
  }, [fetchUnits]);

  useEffect(() => {
    initializeLiff();
  }, [initializeLiff]);

  const handleUnitClick = (unitId: number) => {
    navigate(`/survey/units?ex_id=${exhibitionId}&unit_id=${unitId}`);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleBackClick} className={styles.backButton}>
          ← ย้อนกลับ
        </button>
        <h1>เลือกบูธ/กิจกรรม</h1>
      </div>
      <p className={styles.subtitle}>กรุณาเลือกบูธ/กิจกรรมที่ต้องการทำแบบสอบถาม</p>

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
          <p>Loading units...</p>
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
            onClick={fetchUnits}
            className={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      )}

      {state.status === "success" && (
        <>
          {state.units.length > 0 ? (
            <div className={styles.unitList}>
              {state.units.map((unit) => (
                <div
                  key={unit.unit_id}
                  onClick={() => handleUnitClick(unit.unit_id)}
                  className={styles.unitCard}
                >
                  <div className={styles.unitContent}>
                    <div className={styles.unitHeader}>
                      <h3 className={styles.unitTitle}>
                        {unit.unit_name}
                      </h3>
                      {unit.survey_completed && (
                        <span className={styles.completedBadge}>
                          ✓ ทำแล้ว
                        </span>
                      )}
                    </div>
                    <p className={styles.unitDate}>
                      📅 เข้าชมเมื่อ:{" "}
                      {new Date(unit.checkin_at).toLocaleString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p
                      className={`${styles.unitAction} ${
                        unit.survey_completed
                          ? styles.unitActionCompleted
                          : styles.unitActionPending
                      }`}
                    >
                      {unit.survey_completed
                        ? "คลิกเพื่อดูรายละเอียด →"
                        : "คลิกเพื่อทำแบบสอบถาม →"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyMessage}>
              <p>คุณยังไม่ได้เข้าชมบูธ/กิจกรรมใดๆ</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
