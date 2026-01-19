import { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutFieldConfig } from "../../types/certificate";
import styles from "./DraggablePlaceholder.module.css";

interface DraggablePlaceholderProps {
  fieldName: string;
  displayLabel: string;
  position: { x: number; y: number };
  config: LayoutFieldConfig;
  onPositionChange: (position: { x: number; y: number }) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  disabled?: boolean;
}

export default function DraggablePlaceholder({
  fieldName,
  displayLabel,
  position,
  config,
  onPositionChange,
  containerRef,
  disabled = false,
}: DraggablePlaceholderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);

      // Calculate offset from mouse position to element position
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      dragOffsetRef.current = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      };
    },
    [disabled]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];
      setIsDragging(true);

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      dragOffsetRef.current = {
        x: touch.clientX - rect.left - rect.width / 2,
        y: touch.clientY - rect.top - rect.height / 2,
      };
    },
    [disabled]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      let newX = e.clientX - containerRect.left - dragOffsetRef.current.x;
      let newY = e.clientY - containerRect.top - dragOffsetRef.current.y;

      // Clamp to container bounds
      newX = Math.max(0, Math.min(newX, containerRect.width));
      newY = Math.max(0, Math.min(newY, containerRect.height));

      onPositionChange({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;

      const touch = e.touches[0];
      const containerRect = containerRef.current.getBoundingClientRect();
      let newX = touch.clientX - containerRect.left - dragOffsetRef.current.x;
      let newY = touch.clientY - containerRect.top - dragOffsetRef.current.y;

      // Clamp to container bounds
      newX = Math.max(0, Math.min(newX, containerRect.width));
      newY = Math.max(0, Math.min(newY, containerRect.height));

      onPositionChange({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, containerRef, onPositionChange]);

  return (
    <div
      className={styles.placeholder}
      data-dragging={isDragging}
      data-field={fieldName}
      style={{
        left: position.x,
        top: position.y,
        fontSize: config.font_size ? `${config.font_size * 0.5}px` : "14px",
        color: config.color || "#000000",
        textAlign: config.align || "center",
        cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <span className={styles.label}>{displayLabel}</span>
    </div>
  );
}
