import { useCallback, useState } from "react";
import type { LayoutFieldConfig } from "../../types/certificate";
import styles from "./CertificateDownloadPage.module.css";
import { useCertificateDownload } from "./hooks";

const DEFAULT_PARTICIPANT_NAME_CONFIG: LayoutFieldConfig = {
  x: 300,
  y: 500,
  font_size: 48,
  color: "#000000",
  align: "center",
};

const DEFAULT_EXHIBITION_TITLE_CONFIG: LayoutFieldConfig = {
  x: 300,
  y: 250,
  font_size: 36,
  color: "#333333",
  align: "center",
};

const DEFAULT_ORGANIZER_NAME_CONFIG: LayoutFieldConfig = {
  x: 300,
  y: 750,
  font_size: 20,
  color: "#666666",
  align: "center",
};

export default function CertificateDownloadPage() {
  // Get query params from URL
  const params = new URLSearchParams(window.location.search);
  const exhibitionId = params.get("exhibitionId");
  const userId = params.get("userId");

  const { state, previewData, handleDownload } = useCertificateDownload({
    exhibitionId,
    userId,
  });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    natural: { width: 0, height: 0 },
    display: { width: 0, height: 0 },
  });

  const layoutConfig = previewData?.template.layout_config;
  const participantConfig =
    layoutConfig?.participant_name ?? DEFAULT_PARTICIPANT_NAME_CONFIG;
  const exhibitionConfig =
    layoutConfig?.exhibition_title ?? DEFAULT_EXHIBITION_TITLE_CONFIG;
  const organizerConfig =
    layoutConfig?.organizer_name ?? DEFAULT_ORGANIZER_NAME_CONFIG;

  const toDisplayCoords = useCallback(
    (actual: { x: number; y: number }) => {
      if (
        imageDimensions.natural.width === 0 ||
        imageDimensions.display.width === 0
      ) {
        return actual;
      }
      const scaleX =
        imageDimensions.display.width / imageDimensions.natural.width;
      const scaleY =
        imageDimensions.display.height / imageDimensions.natural.height;
      return {
        x: actual.x * scaleX,
        y: actual.y * scaleY,
      };
    },
    [imageDimensions],
  );

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      natural: { width: img.naturalWidth, height: img.naturalHeight },
      display: { width: img.clientWidth, height: img.clientHeight },
    });
    setImageLoaded(true);
  };

  const participantDisplayPosition = toDisplayCoords({
    x: participantConfig.x,
    y: participantConfig.y,
  });
  const exhibitionDisplayPosition = toDisplayCoords({
    x: exhibitionConfig.x,
    y: exhibitionConfig.y,
  });
  const organizerDisplayPosition = toDisplayCoords({
    x: organizerConfig.x,
    y: organizerConfig.y,
  });

  const getDisplayFontSize = useCallback(
    (fontSize: number) => {
      if (
        imageDimensions.natural.width === 0 ||
        imageDimensions.display.width === 0
      ) {
        return Math.max(8, fontSize);
      }
      const scaleX =
        imageDimensions.display.width / imageDimensions.natural.width;
      const scaleY =
        imageDimensions.display.height / imageDimensions.natural.height;
      return Math.max(8, fontSize * Math.min(scaleX, scaleY));
    },
    [imageDimensions],
  );

  const buildOverlayStyle = (
    config: LayoutFieldConfig,
    position: { x: number; y: number },
  ) => ({
    left: position.x,
    top: position.y,
    fontSize: config.font_size ? `${getDisplayFontSize(config.font_size)}px` : "14px",
    color: config.color || "#000000",
    textAlign: config.align || "center",
  });

  const getBackgroundUrl = () => {
    if (!previewData?.template.background_url) return "";
    const baseUrl =
      import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
      "http://localhost:3001";
    return `${baseUrl}/${previewData.template.background_url}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>เกียรติบัตร</h1>
          <p className={styles.subtitle}>Certificate of Participation</p>
        </header>

        <div className={styles.content}>
          {/* Initializing */}
          {state.status === "initializing" && (
            <div className={styles.statusMessage}>
              <div className={styles.spinner}></div>
              <p>กำลังโหลด...</p>
            </div>
          )}

          {/* Not logged in */}
          {state.status === "not_logged_in" && (
            <div className={styles.statusMessage}>
              <p>กำลังเข้าสู่ระบบ...</p>
            </div>
          )}

          {/* Loading */}
          {state.status === "loading" && (
            <div className={styles.statusMessage}>
              <div className={styles.spinner}></div>
              <p>กำลังโหลดเกียรติบัตร...</p>
            </div>
          )}

          {/* Success - Show preview */}
          {(state.status === "success" ||
            state.status === "downloading" ||
            state.status === "download_complete") &&
            previewData && (
              <div className={styles.previewSection}>
                {/* Exhibition info */}
                <div className={styles.exhibitionInfo}>
                  <h2>{previewData.template.exhibition_title}</h2>
                  <p className={styles.participantName}>
                    {previewData.participantName}
                  </p>
                </div>

                {/* Certificate preview */}
                <div className={styles.previewContainer}>
                  <img
                    src={getBackgroundUrl()}
                    alt="Certificate"
                    className={styles.certificateImage}
                    onLoad={handleImageLoad}
                    draggable={false}
                  />

                  {imageLoaded && (
                    <>
                      <div
                        className={`${styles.textOverlay} ${styles.exhibitionOverlay}`}
                        style={buildOverlayStyle(
                          exhibitionConfig,
                          exhibitionDisplayPosition,
                        )}
                      >
                        {previewData.template.exhibition_title}
                      </div>

                      <div
                        className={`${styles.textOverlay} ${styles.participantOverlay}`}
                        style={buildOverlayStyle(
                          participantConfig,
                          participantDisplayPosition,
                        )}
                      >
                        {previewData.participantName}
                      </div>

                      <div
                        className={`${styles.textOverlay} ${styles.organizerOverlay}`}
                        style={buildOverlayStyle(
                          organizerConfig,
                          organizerDisplayPosition,
                        )}
                      >
                        {previewData.template.organizer_name}
                      </div>
                    </>
                  )}
                </div>

                {/* Download button */}
                <div className={styles.actionSection}>
                  {state.status === "downloading" ? (
                    <button className={styles.downloadBtn} disabled>
                      <div className={styles.spinnerSmall}></div>
                      กำลังดาวน์โหลด...
                    </button>
                  ) : state.status === "download_complete" ? (
                    <button className={styles.downloadBtnSuccess}>
                      ดาวน์โหลดสำเร็จ!
                    </button>
                  ) : (
                    <button
                      className={styles.downloadBtn}
                      onClick={handleDownload}
                    >
                      ดาวน์โหลดเกียรติบัตร (PDF)
                    </button>
                  )}

                  <p className={styles.hint}>
                    กดปุ่มด้านบนเพื่อดาวน์โหลดเกียรติบัตรของคุณ
                  </p>
                </div>
              </div>
            )}

          {/* Error */}
          {state.status === "error" && (
            <div className={styles.errorDisplay}>
              <div className={styles.errorIcon}>!</div>
              <h3>เกิดข้อผิดพลาด</h3>
              <p className={styles.errorMessage}>{state.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
