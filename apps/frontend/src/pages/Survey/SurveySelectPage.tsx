import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";
import axios from "axios";
import { getUserExhibitions, type UserTicket } from "../../api/tickets";
import { toFileUrl } from "../../utils/url";

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
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Select Exhibition for Survey</h1>
      <p>กรุณาเลือกงานที่ต้องการทำแบบสอบถาม</p>

      {state.status === "initializing" && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      {state.status === "not_logged_in" && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Loading login...</p>
        </div>
      )}

      {state.status === "loading" && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div className="spinner"></div>
          <p>Loading your exhibitions...</p>
        </div>
      )}

      {state.status === "error" && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🚫</div>
          <h3>Error</h3>
          <p style={{ color: "#d32f2f", marginBottom: "20px" }}>
            {state.message}
          </p>
          <button
            onClick={fetchExhibitions}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {state.status === "success" && (
        <>
          {state.exhibitions.length > 0 ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {state.exhibitions.map((exhibition) => (
                <div
                  key={exhibition.exhibition_id}
                  onClick={() =>
                    handleExhibitionClick(exhibition.exhibition_id)
                  }
                  style={{
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: "#f9f9f9",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e3f2fd";
                    e.currentTarget.style.borderColor = "#1976d2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9f9f9";
                    e.currentTarget.style.borderColor = "#ddd";
                  }}
                >
                  <div style={{ display: "flex", gap: "16px", position: "relative" }}>
                    {exhibition.picture_path && (
                      <img
                        src={toFileUrl(exhibition.picture_path)}
                        alt={exhibition.title}
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h3 style={{ margin: "0 0 8px 0" }}>
                          {exhibition.title}
                        </h3>
                        {exhibition.survey_completed === 1 && (
                          <span
                            style={{
                              backgroundColor: "#28a745",
                              color: "white",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            ✓ ทำแล้ว
                          </span>
                        )}
                      </div>
                      {exhibition.location && (
                        <p style={{ margin: "4px 0", color: "#666" }}>
                          📍 {exhibition.location}
                        </p>
                      )}
                      <p style={{ margin: "4px 0", color: "#666" }}>
                        📅{" "}
                        {new Date(exhibition.start_date).toLocaleDateString()} -{" "}
                        {new Date(exhibition.end_date).toLocaleDateString()}
                      </p>
                      <p
                        style={{
                          margin: "8px 0 0 0",
                          fontWeight: "bold",
                          color: exhibition.survey_completed === 1 ? "#666" : "#1976d2",
                        }}
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
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>คุณยังไม่ได้ลงทะเบียนงานใดๆ</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
