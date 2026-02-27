import styles from "./FloatingButton.module.css";

type Props = {
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  label?: string;
};

export default function FloatingButton({
  onClick,
  ariaLabel = "เพิ่ม",
  className = "",
  label = "เพิ่ม",
}: Props) {
  const cls = [styles.root, className].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cls}
      onClick={onClick}
    >
      <span className={styles.icon}>＋</span>
      <span className={styles.label}>{label}</span>
    </button>
  );
}
