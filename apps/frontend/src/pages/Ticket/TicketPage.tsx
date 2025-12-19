import { QRCodeSVG } from "qrcode.react";
import "./TicketPage.css";
import { useNavigate } from "react-router-dom";
import { useTickets } from "../../hook/useTickets";

export default function TicketPage() {
  const navigate = useNavigate();

  // Get exhibition_id from URL query string
  const params = new URLSearchParams(window.location.search);
  const exhibitionId = params.get("exhibition_id");

  // Use the custom hook
  const { state, refetch } = useTickets({
    exhibitionId,
    autoRefresh: true
  });

  // Function to go back to Wallet
  const goBackToWallet = () => {
    navigate("/ticket");
  };

  return (
    <div className="ticket-page">
      <div className="ticket-container">
        <header className="ticket-header">
          {/* ✅ 3. เพิ่มปุ่ม Back เล็กๆ ด้านบน */}
          <button className="back-link" onClick={goBackToWallet}>
            &lt; Back
          </button>
          <h1>🎫 E-Ticket</h1>
          <p className="subtitle">Please show this QR at the entrance</p>
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
                    <strong>Ready to Scan</strong>
                    <p>Valid for single entry</p>
                  </div>
                </div>

                <div className="expiry-info">
                  <div className="expiry-countdown">
                    Expires in {state.expiresIn}s
                  </div>
                  <p className="refresh-hint">Auto-refreshes every 5 mins</p>
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
