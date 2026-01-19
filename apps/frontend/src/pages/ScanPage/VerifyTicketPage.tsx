import { QrReader } from "@blackbox-vision/react-qr-reader";
import { useRef, useState } from "react";
import { FaCheck } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { MdErrorOutline } from "react-icons/md";
import { useVerifyTicket } from "./hooks";
import "./StaffScanPage.module.css";
export default function VerifyTicketPage() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const isProcessingRef = useRef(false);
  const { state, verifyTicket, reset } = useVerifyTicket({ enableLiff: true });

  const handleVerify = async (token: string) => {
    setIsCameraOpen(false);
    setIsScanning(false);

    try {
      await verifyTicket(token);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const onScan = (result?: { getText(): string } | null) => {
    // Prevent scanning if already processing or camera is closed
    if (!isCameraOpen || isScanning || isProcessingRef.current) return;

    if (result) {
      const text = result.getText();
      if (text && !isProcessingRef.current) {
        console.log("QR Code scanned:", text.substring(0, 20) + "...");
        isProcessingRef.current = true;
        setIsScanning(true);
        handleVerify(text);
      }
    }
  };

  const handleReset = () => {
    reset();
    isProcessingRef.current = false;
    setIsScanning(false);
    setIsCameraOpen(true);
  };

  const handleStartScanning = () => {
    isProcessingRef.current = false;
    setIsScanning(false);
    setIsCameraOpen(true);
  };

  return (
    <div className="staff-scan-page">
      <header className="staff-header">
        <h1>Staff Scanner</h1>
      </header>

      <div className="scan-container">
        {/* Initializing State */}
        {state.status === "initializing" && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Initializing LIFF...</p>
          </div>
        )}

        {/* Not Logged In State */}
        {state.status === "not_logged_in" && (
          <div className="loading-spinner">
            <p>Redirecting to login...</p>
          </div>
        )}

        {/* Idle State - Ready to Scan */}
        {state.status === "idle" && !isCameraOpen && (
          <div className="result-card">
            <div className="status-icon">📷</div>
            <h2>พร้อมสำหรับการสแกน</h2>
            <p>แตะปุ่มด้านล่างเพื่อเริ่มสแกนคิวอาร์โค้ด</p>
            <button className="next-btn" onClick={handleStartScanning}>
              เริ่มการสแกน
            </button>
          </div>
        )}

        {/* Error Display */}
        {state.status === "error" && (
          <div className="result-card fail">
            <div className="status-icon">
              <IoClose className="icon-fail" />
            </div>
            <h2>Connection Error</h2>
            <p>{state.message}</p>
            <button className="next-btn" onClick={handleReset}>
              Try Again
            </button>
          </div>
        )}

        {/* Scan Result Display */}
        {state.status === "success" && state.result && (
          <div
            className={`result-card ${
              state.result.success ? "success" : "fail"
            }`}
          >
            <div className="status-icon">
              {state.result.success ? (
                <FaCheck className="icon-success" />
              ) : (
                <MdErrorOutline className="icon-warning" />
              )}
            </div>
            <h2>{state.result.message}</h2>

            {state.result.visitor && (
              <div className="visitor-info">
                {state.result.visitor.picture_url && (
                  <img
                    src={state.result.visitor.picture_url}
                    alt={state.result.visitor.full_name}
                    className="visitor-avatar"
                  />
                )}
                <div className="visitor-details">
                  <p className="visitor-name">
                    <strong>Name:</strong> {state.result.visitor.full_name}
                  </p>
                  <p className="checkin-time">
                    <strong>Check-in Time:</strong>{" "}
                    {new Date(state.result.visitor.checkin_at).toLocaleString(
                      "th-TH",
                      {
                        dateStyle: "medium",
                        timeStyle: "medium",
                      },
                    )}
                  </p>
                </div>
              </div>
            )}

            {state.result.code && (
              <p className="error-code">
                <strong>Error Code:</strong> {state.result.code}
              </p>
            )}

            <button className="next-btn" onClick={handleReset}>
              {state.result.success ? "Scan Next" : "Try Again"}
            </button>
          </div>
        )}

        {/* Loading State */}
        {state.status === "loading" && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Verifying ticket...</p>
          </div>
        )}

        {/* Camera */}
        {state.status === "idle" && isCameraOpen && !isScanning && (
          <div className="camera-wrapper">
            <QrReader
              onResult={onScan}
              constraints={{
                facingMode: "environment",
                aspectRatio: 1,
              }}
              videoId="video"
              scanDelay={100}
              containerStyle={{
                width: "100%",
                height: "100%",
              }}
              videoStyle={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        {/* Scanning Overlay - shown when processing */}
        {state.status === "idle" && isCameraOpen && isScanning && (
          <div className="camera-wrapper">
            <div className="scanning-overlay">
              <div className="spinner"></div>
              <p>QR Code Detected! Verifying...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
