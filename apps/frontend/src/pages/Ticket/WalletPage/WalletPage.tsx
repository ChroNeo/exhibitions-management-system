import "./WalletPage.css";
import { useNavigate } from "react-router-dom";
import { useWalletData } from "../../../hook/ีuseWalletData";
import { toThaiDate } from "../../../utils/dateFormat";
const LIFF_CONFIG = {
  apiUrl:
    import.meta.env.VITE_BASE 
};
export default function WalletPage() {
  const navigate = useNavigate();
  const { tickets, userProfile, loading, error, refetch } = useWalletData();
  // ฟังก์ชันเมื่อกดเลือกตั๋ว
  const handleSelectTicket = (exhibitionId: number) => {
    navigate(`/wallet/ticket?exhibition_id=${exhibitionId}`);
  };
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>กำลังโหลดกระเป๋าตังค์...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <p>{error}</p>
        <button onClick={refetch}>ลองใหม่</button>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      <header className="wallet-header">
        <div className="user-info">
          {userProfile?.pictureUrl && (
            <img src={userProfile.pictureUrl} alt="User" className="avatar" />
          )}
          <div>
            <span className="greeting">Hello,</span>
            <h2 className="username">{userProfile?.displayName || "Guest"}</h2>
          </div>
        </div>
        <div className="wallet-title">My Tickets ({tickets.length})</div>
      </header>

      {/* ... (Render List เหมือนเดิม) ... */}
      <div className="ticket-list">
        {tickets.length === 0 ? (
          <div className="empty-state">
            <p>คุณยังไม่มีบัตรเข้างาน</p>
            <p className="sub-text">ลงทะเบียนงานใหม่ได้ที่เมนูกิจกรรม</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.registration_id}
              className="ticket-card"
              onClick={() => handleSelectTicket(ticket.exhibition_id)}
            >
              {/* รูปปกงาน */}
              <div className="card-image">
                {ticket.picture_path ? (
                  <img
                    src={`${LIFF_CONFIG.apiUrl}/${ticket.picture_path}`}
                    alt={ticket.title}
                  />
                ) : (
                  <div className="placeholder-image">🎫</div>
                )}
                <span className={`status-badge ${ticket.status}`}>
                  {ticket.status === "ongoing" ? "NOW SHOWING" : ticket.status}
                </span>
              </div>
              {/* รายละเอียด */}
              <div className="card-content">
                <h3 className="event-title">{ticket.title}</h3>
                <div className="event-info">
                  <p>📅 {toThaiDate(ticket.start_date)}</p>
                  <p>📍 {ticket.location || "TBA"}</p>
                </div>
                <button className="view-qr-btn">Show QR Code &gt;</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
