import { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import liff from '@line/liff';
import axios from 'axios';
import './TicketPage.css';

// Configuration - matches config.js from public folder
const LIFF_CONFIG = {
  liffId: '2008498720-IgQ8sUzW',
  apiUrl: import.meta.env.VITE_API_BASE || 'https://28dbf038a9c8.ngrok-free.app', // เปลี่ยน URL ตามจริง
};

interface QRTokenResponse {
  qr_token: string;
  expires_in: number;
}

type PageState =
  | { status: 'initializing' }
  | { status: 'not_logged_in' }
  | { status: 'loading' }
  | { status: 'success'; qrToken: string; expiresAt: Date; expiresIn: number }
  | { status: 'error'; message: string };

export default function TicketPage() {
  const [state, setState] = useState<PageState>({ status: 'initializing' });

  // ฟังก์ชันสำหรับกลับไปหน้ารายการ (Wallet)
  const goBackToWallet = () => {
    // สมมติว่าหน้า Wallet อยู่ที่ route "/" หรือ "/tickets"
    window.location.href = '/tickets'; 
    // หรือถ้าใช้ react-router-dom: navigate('/tickets')
  };

  const fetchQRCode = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error('Failed to get ID token');
      }

      // ✅ 1. ดึง exhibition_id จาก URL Query String
      const params = new URLSearchParams(window.location.search);
      const exhibitionId = params.get('exhibition_id');

      if (!exhibitionId) {
        throw new Error('No exhibition selected. Please select an exhibition from the list.');
      }

      console.log(`Fetching QR code for Exhibition ID: ${exhibitionId}...`);

      // ✅ 2. ยิง API เส้นใหม่ /qr-token พร้อมส่ง params
      const response = await axios.get<QRTokenResponse>(
        `${LIFF_CONFIG.apiUrl}/tickets/qr-token`, // แก้ path ให้ตรงกับ Controller (api/v1 หรือ tickets)
        {
          params: { exhibition_id: exhibitionId }, // ส่ง ID ไปบอก Backend
          headers: {
            Authorization: `Bearer ${idToken}`,
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      const { qr_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      console.log('QR code received successfully');

      setState({
        status: 'success',
        qrToken: qr_token,
        expiresAt,
        expiresIn: expires_in,
      });

      // Auto-refresh logic
      setTimeout(() => {
        // เช็คว่ายังอยู่หน้าเดิมไหมก่อน refresh
        fetchQRCode();
      }, expires_in * 1000);

    } catch (error) {
      console.error('Failed to fetch QR code:', error);
      let errorMessage = 'Failed to generate QR code';

      if (axios.isAxiosError(error)) {
        if (error.response) {
            // รับ message จาก Backend เช่น "Access Denied"
            errorMessage = error.response.data?.message || errorMessage; 
        } else if (error.request) {
            errorMessage = 'Cannot reach server.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState({ status: 'error', message: errorMessage });
    }
  }, []);

  const initializeLiff = useCallback(async () => {
    try {
      console.log('Initializing LIFF...');
      await liff.init({ liffId: LIFF_CONFIG.liffId });
      
      if (!liff.isLoggedIn()) {
        setState({ status: 'not_logged_in' });
        liff.login({ redirectUri: window.location.href });
        return;
      }

      await fetchQRCode();
    } catch (error) {
      console.error('LIFF init error:', error);
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'LIFF Init Failed',
      });
    }
  }, [fetchQRCode]);

  useEffect(() => {
    initializeLiff();
  }, [initializeLiff]);

  return (
    <div className="ticket-page">
      <div className="ticket-container">
        <header className="ticket-header">
           {/* ✅ 3. เพิ่มปุ่ม Back เล็กๆ ด้านบน */}
          <button className="back-link" onClick={goBackToWallet}>&lt; Back</button>
          <h1>🎫 E-Ticket</h1>
          <p className="subtitle">Please show this QR at the entrance</p>
        </header>

        <div className="ticket-content">
          {state.status === 'initializing' && (
            <div className="status-message">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          )}

          {state.status === 'not_logged_in' && (
             <div className="status-message">Loading login...</div>
          )}

          {state.status === 'loading' && (
            <div className="status-message">
              <div className="spinner"></div>
              <p>Generatng Secure QR...</p>
            </div>
          )}

          {state.status === 'success' && (
            <div className="qr-display">
              <div className="qr-wrapper">
                <QRCodeSVG
                  value={state.qrToken}
                  size={260}
                  level="H"
                  includeMargin={true}
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

          {state.status === 'error' && (
            <div className="error-display">
              <div className="error-icon">🚫</div>
              <h3>Access Denied</h3>
              <p className="error-message">{state.message}</p>
              
              <div className="action-buttons">
                <button onClick={fetchQRCode} className="retry-btn">
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