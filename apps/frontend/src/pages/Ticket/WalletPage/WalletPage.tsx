import { useEffect, useState } from "react";
import axios from "axios";
import liff from "@line/liff";
import "./WalletPage.css";
import { useNavigate } from "react-router-dom";

// Config (เหมือนเดิม)
const LIFF_CONFIG = {
  liffId: "2008498720-IgQ8sUzW", // ใส่ LIFF ID ของคุณ
  apiUrl:
    import.meta.env.VITE_BASE 
};

// Type ให้ตรงกับที่ Backend ส่งมา (จาก getUserTickets ใน query file)
interface Ticket {
  registration_id: number;
  exhibition_id: number;
  title: string;
  code: string;
  location: string;
  start_date: string;
  end_date: string;
  picture_path: string | null;
  status: string; // 'published', 'ongoing', etc.
}

export default function WalletPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState<{
    displayName: string;
    pictureUrl?: string;
  } | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const init = async () => {
      try {
        await liff.init({ liffId: LIFF_CONFIG.liffId });

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const profile = await liff.getProfile();
        setUserProfile({
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        });

        const idToken = liff.getIDToken();
        if (!idToken) throw new Error("No ID Token");

        // ยิง API ดึงรายการตั๋ว
        console.log("Fetching tickets...");
        const response = await axios.get<Ticket[]>(
          `${LIFF_CONFIG.apiUrl}/api/v1/ticket/`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        setTickets(response.data);
      } catch (err) {
        console.error(err);
        setError("ไม่สามารถโหลดข้อมูลบัตรได้");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // ฟังก์ชันเมื่อกดเลือกตั๋ว
  const handleSelectTicket = (exhibitionId: number) => {
    // เปลี่ยนหน้าไปที่ TicketPage พร้อมส่ง ID ไปด้วย
    // (สมมติว่า TicketPage อยู่ที่ path /ticket)
    navigate(`/wallet/ticket?exhibition_id=${exhibitionId}`);
  };

  // Helper แปลงวันที่ให้สวยๆ
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("th-TH", options);
  };

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your wallet...</p>
      </div>
    );

  if (error) return <div className="error-screen">{error}</div>;

  return (
    <div className="wallet-page">
      {/* Header ส่วนบน */}
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

      {/* List รายการตั๋ว */}
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
                  <p>📅 {formatDate(ticket.start_date)}</p>
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
