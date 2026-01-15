import { useCallback, useState } from "react";
import type { LayoutConfig, LayoutFieldConfig } from "../../types/certificate";
import styles from "./CertificatePreview.module.css";

const DEFAULT_PARTICIPANT_NAME_CONFIG: LayoutFieldConfig = {
  x: 300,
  y: 500,
  font_size: 48,
  color: "#000000",
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
    [imageDimensions]
  );

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      natural: { width: img.naturalWidth, height: img.naturalHeight },
      display: { width: img.clientWidth, height: img.clientHeight },
    });
    setImageLoaded(true);
  };

  const displayPosition = toDisplayCoords({
    x: participantConfig.x,
    y: participantConfig.y,
  });

  return (
    <div className={styles.previewContainer}>
      <img
        src={backgroundUrl}
        alt="Certificate Background"
        className={styles.backgroundImage}
        onLoad={handleImageLoad}
        draggable={false}
      />

      {imageLoaded && (
        <div
          className={styles.placeholder}
          style={{
            left: displayPosition.x,
            top: displayPosition.y,
            fontSize: participantConfig.font_size
              ? `${participantConfig.font_size * 0.5}px`
              : "14px",
            color: participantConfig.color || "#000000",
            textAlign: participantConfig.align || "center",
          }}
        >
          <span className={styles.label}>ชื่อผู้เข้าร่วม</span>
        </div>
      )}
    </div>
  );
}
