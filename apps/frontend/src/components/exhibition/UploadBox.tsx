import styles from "./ExhibitionDetailCard.module.css";

type Props = {
  accept: string;
  onChange: (file: File | undefined) => void;
  text?: string;
  hint?: string;
};

export default function UploadBox({
  accept,
  onChange,
  text = "คลิกเพื่อเลือกไฟล์",
  hint,
}: Props) {
  return (
    <label className={styles.uploadBox}>
      <input
        className={styles.uploadInput}
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      <div className={styles.uploadIcon}>
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <div className={styles.uploadText}>{text}</div>
      {hint && <div className={styles.uploadHint}>{hint}</div>}
    </label>
  );
}
