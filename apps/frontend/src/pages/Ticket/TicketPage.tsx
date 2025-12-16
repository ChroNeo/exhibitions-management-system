import { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import liff from '@line/liff';
import axios from 'axios';
import './TicketPage.css';

// Configuration - matches config.js from public folder
const LIFF_CONFIG = {
  liffId: '2008498720-IgQ8sUzW',
  apiUrl: import.meta.env.VITE_API_BASE || 'https://28dbf038a9c8.ngrok-free.app',
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

  const fetchQRCode = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error('Failed to get ID token');
      }

      console.log('Fetching QR code from API...');
      console.log('API URL:', LIFF_CONFIG.apiUrl);

      const response = await axios.get<QRTokenResponse>(
        `${LIFF_CONFIG.apiUrl}/ticket/my-qr`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      const { qr_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      console.log('QR code received successfully');
      console.log('Expires in:', expires_in, 'seconds');

      setState({
        status: 'success',
        qrToken: qr_token,
        expiresAt,
        expiresIn: expires_in,
      });

      // Auto-refresh when token expires
      setTimeout(() => {
        fetchQRCode();
      }, expires_in * 1000);
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
      let errorMessage = 'Failed to generate QR code';

      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
        } else if (error.request) {
          errorMessage = 'Cannot reach the server. Please check your connection.';
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
      console.log('LIFF initialized successfully');

      if (!liff.isLoggedIn()) {
        console.log('User not logged in, redirecting to login...');
        setState({ status: 'not_logged_in' });
        // Auto-login
        liff.login({ redirectUri: window.location.href });
        return;
      }

      // User is logged in, fetch QR code immediately
      await fetchQRCode();
    } catch (error) {
      console.error('LIFF initialization error:', error);
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to initialize LIFF',
      });
    }
  }, [fetchQRCode]);

  useEffect(() => {
    initializeLiff();
  }, [initializeLiff]);

  const handleRefresh = () => {
    fetchQRCode();
  };

  return (
    <div className="ticket-page">
      <div className="ticket-container">
        <header className="ticket-header">
          <h1>🎫 My Ticket</h1>
          <p className="subtitle">Exhibition Entry QR Code</p>
        </header>

        <div className="ticket-content">
          {state.status === 'initializing' && (
            <div className="status-message">
              <div className="spinner"></div>
              <p>Initializing...</p>
            </div>
          )}

          {state.status === 'not_logged_in' && (
            <div className="status-message">
              <div className="spinner"></div>
              <p>Redirecting to LINE login...</p>
            </div>
          )}

          {state.status === 'loading' && (
            <div className="status-message">
              <div className="spinner"></div>
              <p>Generating your QR code...</p>
            </div>
          )}

          {state.status === 'success' && (
            <div className="qr-display">
              <div className="qr-wrapper">
                <QRCodeSVG
                  value={state.qrToken}
                  size={280}
                  level="H"
                  includeMargin={true}
                  className="qr-code"
                />
              </div>

              <div className="qr-info">
                <div className="info-card success">
                  <span className="icon">✓</span>
                  <div className="info-text">
                    <strong>QR Code Active</strong>
                    <p>Show this to staff at the entrance</p>
                  </div>
                </div>

                <div className="expiry-info">
                  <div className="expiry-label">Valid until:</div>
                  <div className="expiry-time">
                    {state.expiresAt.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                  <div className="expiry-countdown">
                    Expires in {state.expiresIn} seconds
                  </div>
                </div>

                <button onClick={handleRefresh} className="refresh-btn">
                  🔄 Refresh QR Code
                </button>

                <div className="info-card info">
                  <span className="icon">ℹ️</span>
                  <div className="info-text">
                    <strong>Note:</strong>
                    <p>This QR code automatically refreshes every 5 minutes for security.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {state.status === 'error' && (
            <div className="error-display">
              <div className="error-icon">⚠️</div>
              <h2>Unable to Generate QR Code</h2>
              <p className="error-message">{state.message}</p>

              <div className="error-suggestions">
                <h3>Possible solutions:</h3>
                <ul>
                  <li>Make sure you're registered for at least one exhibition</li>
                  <li>Check your internet connection</li>
                  <li>Try refreshing the page</li>
                </ul>
              </div>

              <button onClick={handleRefresh} className="retry-btn">
                🔄 Try Again
              </button>
            </div>
          )}
        </div>

        <footer className="ticket-footer">
          <p className="footer-text">Powered by EMS</p>
        </footer>
      </div>
    </div>
  );
}
