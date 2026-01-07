import { QRCodeSVG } from "qrcode.react";
import "./TicketPage.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useTickets } from "../../hook/useTickets";
import { IoArrowBack } from "react-icons/io5";
interface LocationState {
  title?: string;
}

export default function TicketPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const exhibitionTitle = (location.state as LocationState)?.title;

  // Get exhibition_id from URL query string
  const params = new URLSearchParams(window.location.search);
  const exhibitionId = params.get("exhibition_id");

  // Use the custom hook
  const { state, refetch } = useTickets({
    exhibitionId,
    autoRefresh: true,
  });

  // Function to go back to Wallet
  const goBackToWallet = () => {
    navigate("/wallet");
  };

  return (
    <div className="ticket-page">
      <div className="ticket-container">
        <header className="ticket-header">
          <button className="back-link" onClick={goBackToWallet}>
            <IoArrowBack />
          </button>
          <h1 className="ticket-title">{exhibitionTitle || "E-Ticket"}</h1>
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
                  value={state.qrToken}
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
                    หมดอายุใน {state.expiresIn}วินาที
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
                {/* ปุ่มกลับหน้ารายการ กรณีเข้าผิดงาน */}
                <button onClick={goBackToWallet} className="secondary-btn">
                  Back to My Tickets
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
