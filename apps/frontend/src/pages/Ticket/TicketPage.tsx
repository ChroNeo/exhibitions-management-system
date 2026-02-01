import liff from "@line/liff";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { checkCheckInStatus, getCheckedInUnits } from "../../api/tickets";
import { LIFF_CONFIG as LIFF_IDS } from "../../config/liff";
import { useTickets } from "./hooks";
import "./TicketPage.css";

const API_BASE = import.meta.env.VITE_BASE;

export default function TicketPage() {
  const [exhibitionId, setExhibitionId] = useState<string | null>(null);
  const [fetchingExhibition, setFetchingExhibition] = useState(true);

  // Fetch current exhibition ID from API
  useEffect(() => {
    async function fetchCurrentExhibition() {
      try {
        if (!liff.id) {
          await liff.init({ liffId: LIFF_IDS.TICKET });
        }
        if (!liff.isLoggedIn()) return;
        const idToken = liff.getIDToken();
        if (!idToken) return;
        const res = await axios.get<{ current_exhibition_id: number | null }>(
          `${API_BASE}/api/v1/ticket/current-exhibition`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "ngrok-skip-browser-warning": "true",
            },
          },
        );
        if (res.data.current_exhibition_id) {
          setExhibitionId(String(res.data.current_exhibition_id));
        }
      } catch (err) {
        console.error("Failed to fetch current exhibition:", err);
      } finally {
        setFetchingExhibition(false);
      }
    }
    fetchCurrentExhibition();
  }, []);

  useEffect(() => {
    if (fetchingExhibition) {
      Swal.fire({
        title: "Loading...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
    } else {
      Swal.close();
      if (!exhibitionId) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No current exhibition available",
        });
      }
    }
  }, [fetchingExhibition, exhibitionId]);

  if (fetchingExhibition || !exhibitionId) {
    return null;
  }

  return <TicketContent exhibitionId={exhibitionId} />;
}

function TicketContent({ exhibitionId }: { exhibitionId: string }) {
  const navigate = useNavigate();

  // Use the custom hook
  const { state, refetch } = useTickets({
    exhibitionId,
    autoRefresh: true,
  });

  // Countdown timer
  const [countdown, setCountdown] = useState<number | null>(null);

  const qrToken = state.status === "success" ? state.data.qrToken : null;
  const expiresIn = state.status === "success" ? state.data.expiresIn : null;

  useEffect(() => {
    if (qrToken && expiresIn) {
      setCountdown(expiresIn);
    }
  }, [qrToken, expiresIn]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Use ref to track if we've already shown the popup
  const hasShownPopupRef = useRef(false);

  // Check once on page load if user has incomplete surveys
  useEffect(() => {
    if (!exhibitionId || hasShownPopupRef.current) return;

    const checkForIncompleteSurveys = async () => {
      try {
        const status = await checkCheckInStatus(exhibitionId);

        // Only proceed if user has checked in
        if (status.checked_in && !hasShownPopupRef.current && status.unit_id) {
          // Get all checked-in units
          const units = await getCheckedInUnits(exhibitionId);

          // Check if there are any units with incomplete surveys
          const hasIncompleteSurveys = units.some(
            (unit) => !unit.survey_completed,
          );

          // Only show popup if there are incomplete surveys
          if (hasIncompleteSurveys) {
            hasShownPopupRef.current = true;

            // Show SweetAlert popup
            const result = await Swal.fire({
              title: "มีแบบสอบถาม บูธ/กิจกรรม",
              text: "คุณต้องการทำแบบสอบถามบูธ/กิจกรรมหรือไม่?",
              icon: "question",
              showCancelButton: true,
              confirmButtonColor: "#667eea",
              cancelButtonColor: "#d33",
              confirmButtonText: "ทำแบบสอบถาม",
              cancelButtonText: "ไว้ทีหลัง",
            });

            if (result.isConfirmed) {
              // Navigate to unit list page
              navigate(`/survey/unit-list?ex_id=${exhibitionId}`);
            }
          }
        }
      } catch (error) {
        // Silently fail - user might not be logged in yet or network issue
        console.error("Failed to check for incomplete surveys:", error);
      }
    };

    // Check only once on page load
    checkForIncompleteSurveys();
  }, [exhibitionId, navigate]);
  return (
    <div className="ticket-page">
      <div className="ticket-container">
        <header className="ticket-header">
          <h1 className="ticket-title">E-Ticket</h1>
          <p className="subtitle">โปรดแสดงคิวอาร์โค้ดนี้ให้เจ้าหน้าที่</p>
        </header>

        <div className="ticket-content">
          {state.status === "initializing" && (
            <div className="status-message">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          )}

          {state.status === "not_logged_in" && (
            <div className="status-message">Loading login...</div>
          )}

          {state.status === "loading" && (
            <div className="status-message">
              <div className="spinner"></div>
              <p>Generatng Secure QR...</p>
            </div>
          )}

          {state.status === "success" && (
            <div className="qr-display">
              <div className="qr-wrapper">
                <QRCodeSVG
                  value={state.data.qrToken}
                  size={260}
                  level="H"
                  className="qr-code"
                />
              </div>

              <div className="qr-info">
                <div className="info-card success">
                  <span className="icon">✓</span>
                  <div className="info-text">
                    <strong>พร้อมสำหรับการสแกน</strong>
                    <p>ใช้ได้สำหรับการเข้าครั้งเดียว</p>
                  </div>
                </div>

                <div className="expiry-info">
                  <div className="expiry-countdown">
                    หมดอายุใน{" "}
                    {countdown !== null
                      ? formatCountdown(countdown)
                      : state.data.expiresIn + "วินาที"}
                  </div>
                  <p className="refresh-hint">รีเฟรชอัตโนมัติทุก 5 นาที</p>
                </div>
              </div>
            </div>
          )}

          {state.status === "error" && (
            <div className="error-display">
              <div className="error-icon">🚫</div>
              <h3>Access Denied</h3>
              <p className="error-message">{state.message}</p>
              <div className="action-buttons">
                <button onClick={refetch} className="retry-btn">
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
