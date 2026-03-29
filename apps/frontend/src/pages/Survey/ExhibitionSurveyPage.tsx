import liff from "@line/liff";
import { useEffect, useState } from "react";
import { IoCloseCircle } from "react-icons/io5";
import { useNavigate, useSearchParams } from "react-router-dom";
import liffClient from "../../api/liffClient";
import { LIFF_CONFIG } from "../../config/liff";
import { isLiffMockEnabled } from "../../hooks/useLiff";
import { ExhibitionSurveyContent } from "./components/ExhibitionSurveyContent";
import styles from "./ExhibitionSurvey.module.css";

export default function ExhibitionSurveyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryExhibitionId = searchParams.get("ex_id");
  const [resolvedExhibitionId, setResolvedExhibitionId] = useState<
    string | null
  >(queryExhibitionId && /^\d+$/.test(queryExhibitionId) ? queryExhibitionId : null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    queryExhibitionId && /^\d+$/.test(queryExhibitionId) ? "ready" : "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    queryExhibitionId && !/^\d+$/.test(queryExhibitionId)
      ? "Exhibition ID is invalid."
      : null,
  );

  useEffect(() => {
    if (queryExhibitionId) {
      if (/^\d+$/.test(queryExhibitionId)) {
        setResolvedExhibitionId(queryExhibitionId);
        setStatus("ready");
        setErrorMessage(null);
      } else {
        setResolvedExhibitionId(null);
        setStatus("error");
        setErrorMessage("Exhibition ID is invalid.");
      }
      return;
    }

    let cancelled = false;

    async function fetchCurrentExhibition() {
      try {
        if (!isLiffMockEnabled()) {
          if (!liff.id) {
            await liff.init({ liffId: LIFF_CONFIG.EXHIBITION_SURVEY });
          }
          if (!liff.isLoggedIn()) {
            liff.login({ redirectUri: window.location.href });
            return;
          }
        }

        const response = await liffClient.get<{
          current_exhibition_id: number | null;
        }>("/ticket/current-exhibition");

        if (cancelled) return;

        if (!response.data.current_exhibition_id) {
          setStatus("error");
          setErrorMessage("No current exhibition available.");
          return;
        }

        setResolvedExhibitionId(String(response.data.current_exhibition_id));
        setStatus("ready");
        setErrorMessage(null);
      } catch (error) {
        if (cancelled) return;

        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load exhibition.",
        );
      }
    }

    void fetchCurrentExhibition();

    return () => {
      cancelled = true;
    };
  }, [queryExhibitionId]);

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.statusCard}>
            <div className={styles.spinner} />
            <p>Loading exhibition...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error" || !resolvedExhibitionId) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.statusCard}>
            <IoCloseCircle className={styles.errorIcon} />
            <h3>Error</h3>
            <p className={styles.errorMessage}>
              {errorMessage ?? "Exhibition ID is missing."}
            </p>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <ExhibitionSurveyContent exhibitionId={resolvedExhibitionId} />;
}
