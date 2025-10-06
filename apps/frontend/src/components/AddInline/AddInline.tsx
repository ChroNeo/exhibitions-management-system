import styles from "./AddInline.module.css";

type Props = {
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  variant?: "inline" | "floating";
  label?: string;
};

export default function AddInline({
  onClick,
  ariaLabel = "เพิ่ม",
  className = "",
  variant = "inline",
  label = "เพิ่ม",
}: Props) {
  const cls = [
    styles.root,
    variant === "floating" ? styles.floating : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

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
