import styles from "./KpiCard.module.css";

export interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorKey: "blue" | "indigo" | "emerald" | "amber";
  subtitle?: string;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  colorKey,
  subtitle,
}: KpiCardProps) {
  return (
    <div className={`${styles.kpiCard} ${styles[`kpi_${colorKey}`]}`}>
      <div className={styles.kpiIcon}>
        <Icon size={28} />
      </div>
      <div className={styles.kpiText}>
        <p className={styles.kpiTitle}>{title}</p>
        <h3 className={styles.kpiValue}>{value}</h3>
        {subtitle && <p className={styles.kpiSub}>{subtitle}</p>}
      </div>
    </div>
  );
}
