import { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutConfig, LayoutFieldConfig } from "../../types/certificate";
import styles from "./CertificatePreview.module.css";

const DEFAULT_PARTICIPANT_NAME_CONFIG: LayoutFieldConfig = {
  x: 300,
  y: 380,
  font_size: 48,
  color: "#000000",
  align: "center",
};

const DEFAULT_EXHIBITION_TITLE_CONFIG: LayoutFieldConfig = {
  x: 300,
  y: 580,
  font_size: 34,
  color: "#333333",
  align: "center",
};

const DEFAULT_ORGANIZER_NAME_CONFIG: LayoutFieldConfig = {
  x: 300,
  y: 920,
  font_size: 16,
  color: "#666666",
  align: "center",
};

interface CertificatePreviewProps {
  backgroundUrl: string;
  layoutConfig: LayoutConfig | null;
}

interface ImageDimensions {
  natural: { width: number; height: number };
  display: { width: number; height: number };
}

export default function CertificatePreview({
  backgroundUrl,
  layoutConfig,
}: CertificatePreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions>({
    natural: { width: 0, height: 0 },
    display: { width: 0, height: 0 },
  });

  const participantConfig =
    layoutConfig?.participant_name ?? DEFAULT_PARTICIPANT_NAME_CONFIG;
  const exhibitionConfig =
    layoutConfig?.exhibition_title ?? DEFAULT_EXHIBITION_TITLE_CONFIG;
  const organizerConfig =
    layoutConfig?.organizer_name ?? DEFAULT_ORGANIZER_NAME_CONFIG;

  // Convert actual coordinates to display coordinates
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

  const getDisplayFontSize = useCallback(
    (fontSize: number) => {
      if (
        imageDimensions.natural.width === 0 ||
        imageDimensions.display.width === 0
      ) {
        return Math.max(8, Math.min(fontSize, 20));
      }
      const scaleX =
        imageDimensions.display.width / imageDimensions.natural.width;
      const scaleY =
        imageDimensions.display.height / imageDimensions.natural.height;
      const scaled = fontSize * Math.min(scaleX, scaleY);
      return Math.max(8, Math.min(scaled, 20));
    },
    [imageDimensions],
  );

  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      natural: { width: img.naturalWidth, height: img.naturalHeight },
      display: { width: img.clientWidth, height: img.clientHeight },
    });
    setImageLoaded(true);
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !imageLoaded) return;

    const observer = new ResizeObserver(() => {
      setImageDimensions((prev) => ({
        ...prev,
        display: { width: img.clientWidth, height: img.clientHeight },
      }));
    });

    observer.observe(img);
    return () => observer.disconnect();
  }, [imageLoaded]);

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

  const buildPlaceholderStyle = (
    config: LayoutFieldConfig,
    position: { x: number; y: number },
  ) => ({
    left: position.x,
    top: position.y,
    fontSize: config.font_size ? `${getDisplayFontSize(config.font_size)}px` : "14px",
    color: config.color || "#000000",
    textAlign: config.align || "center",
  });

  return (
    <div className={styles.previewContainer}>
      <img
        ref={imgRef}
        src={backgroundUrl}
        alt="พื้นหลังใบประกาศนียบัตร"
        className={styles.backgroundImage}
        onLoad={handleImageLoad}
        draggable={false}
      />

      {imageLoaded && (
        <>
          <div
            className={`${styles.placeholder} ${styles.exhibitionPlaceholder}`}
            style={buildPlaceholderStyle(exhibitionConfig, exhibitionDisplayPosition)}
          >
            <span className={styles.label}>ชื่อนิทรรศการ</span>
          </div>

          <div
            className={`${styles.placeholder} ${styles.participantPlaceholder}`}
            style={buildPlaceholderStyle(
              participantConfig,
              participantDisplayPosition,
            )}
          >
            <span className={styles.label}>ชื่อผู้เข้าร่วม</span>
          </div>

          <div
            className={`${styles.placeholder} ${styles.organizerPlaceholder}`}
            style={buildPlaceholderStyle(organizerConfig, organizerDisplayPosition)}
          >
            <span className={styles.label}>ชื่อหน่วยงาน</span>
          </div>
        </>
      )}
    </div>
  );
}
