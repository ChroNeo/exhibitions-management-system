import styles from "../CreateSurvey.module.css";

interface LoadingOverlayProps {
  message: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingSpinner} />
      <p>{message}</p>
    </div>
  );
}
