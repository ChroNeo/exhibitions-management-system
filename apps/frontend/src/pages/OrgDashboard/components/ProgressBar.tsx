import styles from "./ProgressBar.module.css";

export function scoreColorClass(score: number) {
  if (score >= 4.5) return styles.fillGreen;
  if (score >= 4.0) return styles.fillAmber;
  return styles.fillRed;
}

export interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  colorClass?: string;
}

export function ProgressBar({ label, value, max, suffix = "", colorClass }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barClass = colorClass ?? scoreColorClass(value);
  return (
    <div className={styles.progressItem}>
      <div className={styles.progressHeader}>
        <span className={styles.progressLabel}>{label}</span>
        <span className={styles.progressValue}>
          {value}
          {suffix}
        </span>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export { styles as progressStyles };
