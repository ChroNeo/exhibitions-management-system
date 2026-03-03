import pageStyles from "../UnitDashboardPage.module.css";
import styles from "./UnitDashboardSkeleton.module.css";

export function UnitDashboardSkeleton() {
  return (
    <div className={pageStyles.page}>
      <div className={styles.skHeader}>
        <div className={styles.skHeaderLeft}>
          <div className={styles.skTitle} />
          <div className={styles.skSubtitle} />
        </div>
        <div className={styles.skSelector} />
      </div>

      <div className={styles.skKpiGrid}>
        <div className={styles.skKpiCard} />
        <div className={styles.skKpiCard} />
        <div className={styles.skKpiCard} />
        <div className={styles.skKpiCard} />
      </div>

      <div className={styles.skCardRadar} />
      <div className={styles.skCardList} />
      <div className={styles.skCardInfo} />
    </div>
  );
}
