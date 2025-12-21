import { useState } from 'react';
import { QrReader } from '@blackbox-vision/react-qr-reader';
import { useVerifyTicket } from '../../hook/useVerifyTicket';
import './StaffScanPage.css';

export default function StaffScanPage() {
  const [isCameraOpen, setIsCameraOpen] = useState(true);
  const { verifyTicket, reset, isLoading, result, error } = useVerifyTicket({ enableLiff: false });

  const handleVerify = async (token: string) => {
    setIsCameraOpen(false);
    await verifyTicket(token);
  };

  const onScan = (result?: { getText(): string } | null) => {
    if (result) {
      const text = result.getText();
      if (text) handleVerify(text);
    }
  };

  const handleReset = () => {
    reset();
    setIsCameraOpen(true);
  };

  return (
    <div className="staff-scan-page">
      <header className="staff-header">
        <h1>👮 Staff Scanner</h1>
      </header>

      <div className="scan-container">
        {/* Error Display */}
        {error && (
          <div className="result-card fail">
            <div className="status-icon">❌</div>
            <h2>Connection Error</h2>
            <p>{error}</p>
            <button className="next-btn" onClick={handleReset}>Try Again</button>
          </div>
        )}

        {/* Scan Result Display */}
        {result && (
          <div className={`result-card ${result.success ? 'success' : 'fail'}`}>
            <div className="status-icon">
              {result.success ? '✅' : '⚠️'}
            </div>
            <h2>{result.message}</h2>

            {result.visitor && (
              <div className="visitor-info">
                {result.visitor.picture_url && (
                  <img
                    src={result.visitor.picture_url}
                    alt={result.visitor.full_name}
                    className="visitor-avatar"
                  />
                )}
                <div className="visitor-details">
                  <p className="visitor-name">
                    <strong>Name:</strong> {result.visitor.full_name}
                  </p>
                  <p className="checkin-time">
                    <strong>Check-in Time:</strong>{' '}
                    {new Date(result.visitor.checkin_at).toLocaleString('th-TH', {
                      dateStyle: 'medium',
                      timeStyle: 'medium'
                    })}
                  </p>
                </div>
              </div>
            )}

            {result.code && (
              <p className="error-code">
                <strong>Error Code:</strong> {result.code}
              </p>
            )}

            <button className="next-btn" onClick={handleReset}>
              {result.success ? 'Scan Next' : 'Try Again'}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Verifying ticket...</p>
          </div>
        )}

        {/* Camera */}
        {!result && !isLoading && !error && (
             <div className="camera-wrapper">
                 {isCameraOpen && (
                    <QrReader
                        onResult={onScan}
                        constraints={{
                          facingMode: 'environment',
                          aspectRatio: 1
                        }}
                        videoId="video"
                        scanDelay={300}
                        containerStyle={{
                          width: '100%',
                          height: '100%'
                        }}
                        videoStyle={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                    />
                 )}
             </div>
        )}
      </div>
    </div>
  );
}