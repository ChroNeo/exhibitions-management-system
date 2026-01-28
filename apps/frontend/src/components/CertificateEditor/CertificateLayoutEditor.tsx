import { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutConfig, LayoutFieldConfig } from "../../types/certificate";
import DraggablePlaceholder from "./DraggablePlaceholder";
import styles from "./CertificateLayoutEditor.module.css";

const DEFAULT_PARTICIPANT_NAME_CONFIG: LayoutFieldConfig = {
  x: 300,
  y: 500,
  font_size: 48,
  color: "#000000",
  align: "center",
};

interface CertificateLayoutEditorProps {
  backgroundUrl: string;
  layoutConfig: LayoutConfig;
  onSave: (config: LayoutConfig) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

interface ImageDimensions {
  natural: { width: number; height: number };
  display: { width: number; height: number };
}

export default function CertificateLayoutEditor({
  backgroundUrl,
  layoutConfig,
  onSave,
  onCancel,
  isSaving,
}: CertificateLayoutEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions>({
    natural: { width: 0, height: 0 },
    display: { width: 0, height: 0 },
  });

  // Local config state for editing
  const [localConfig, setLocalConfig] = useState<LayoutConfig>(() => ({
    ...layoutConfig,
    participant_name:
      layoutConfig.participant_name ?? DEFAULT_PARTICIPANT_NAME_CONFIG,
  }));

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

  // Convert display coordinates to actual coordinates
  const toActualCoords = useCallback(
    (display: { x: number; y: number }) => {
      if (
        imageDimensions.natural.width === 0 ||
        imageDimensions.display.width === 0
      ) {
        return display;
      }
      const scaleX =
        imageDimensions.natural.width / imageDimensions.display.width;
      const scaleY =
        imageDimensions.natural.height / imageDimensions.display.height;
      return {
        x: Math.round(display.x * scaleX),
        y: Math.round(display.y * scaleY),
      };
    },
    [imageDimensions]
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

  // Update display dimensions on resize so coordinates stay accurate
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

  const handlePositionChange = useCallback(
    (displayPosition: { x: number; y: number }) => {
      const actualPosition = toActualCoords(displayPosition);
      setLocalConfig((prev) => ({
        ...prev,
        participant_name: {
          ...(prev.participant_name ?? DEFAULT_PARTICIPANT_NAME_CONFIG),
          x: actualPosition.x,
          y: actualPosition.y,
        },
      }));
    },
    [toActualCoords]
  );

  const handleSave = async () => {
    await onSave(localConfig);
  };

  const participantConfig =
    localConfig.participant_name ?? DEFAULT_PARTICIPANT_NAME_CONFIG;
  const displayPosition = toDisplayCoords({
    x: participantConfig.x,
    y: participantConfig.y,
  });

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorHeader}>
        <h4>แก้ไข Layout - ลากเพื่อจัดตำแหน่งข้อความ</h4>
        <p className={styles.hint}>
          ลากกล่องข้อความไปยังตำแหน่งที่ต้องการบน Certificate
        </p>
      </div>

      <div className={styles.imageWrapper}>
        <div
          className={styles.imageContainer}
          ref={containerRef}
          data-dragging="false"
        >
          <img
            ref={imgRef}
            src={backgroundUrl}
            alt="Certificate Background"
            className={styles.backgroundImage}
            onLoad={handleImageLoad}
            draggable={false}
          />

          {imageLoaded && (
            <DraggablePlaceholder
              fieldName="participant_name"
              displayLabel="ชื่อผู้เข้าร่วม"
              position={displayPosition}
              config={participantConfig}
              onPositionChange={handlePositionChange}
              containerRef={containerRef}
              disabled={isSaving}
            />
          )}
        </div>
      </div>

      <div className={styles.positionInfo}>
        <span>
          ตำแหน่ง: X = {participantConfig.x}, Y = {participantConfig.y}
        </span>
      </div>

      <div className={styles.editorActions}>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={styles.saveButton}
        >
          {isSaving ? "กำลังบันทึก..." : "บันทึก Layout"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className={styles.cancelButton}
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
