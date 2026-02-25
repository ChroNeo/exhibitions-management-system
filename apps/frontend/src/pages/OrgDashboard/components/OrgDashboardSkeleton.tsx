import pageStyles from "../OrgDashboardPage.module.css";
import styles from "./OrgDashboardSkeleton.module.css";

export function OrgDashboardSkeleton() {
  return (
    <div className={pageStyles.page}>
      {/* Header */}
      <div className={styles.skHeader}>
        <div className={styles.skHeaderLeft}>
          <div className={styles.skTitle} />
          <div className={styles.skSubtitle} />
        </div>
        <div className={styles.skSelector} />
      </div>

      {/* KPI cards */}
      <div className={styles.skKpiGrid}>
        <div className={styles.skKpiCard} />
        <div className={styles.skKpiCard} />
        <div className={styles.skKpiCard} />
        <div className={styles.skKpiCard} />
      </div>

      {/* Demographics + Feedback */}
      <div className={styles.skMidGrid}>
        <div className={styles.skDemoColumn}>
          <div className={styles.skCardShort} />
          <div className={styles.skCardShort} />
        </div>
        <div className={styles.skCardTall} />
      </div>

      {/* Check-ins bar chart */}
      <div className={styles.skBarCard} />

      {/* Table */}
      <div className={styles.skTableCard} />
    </div>
  );
}
