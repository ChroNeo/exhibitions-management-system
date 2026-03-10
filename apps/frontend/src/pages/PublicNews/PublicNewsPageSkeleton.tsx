import pageStyles from "./PublicNewsPage.module.css";
import styles from "./PublicNewsPageSkeleton.module.css";

export function PublicNewsPageSkeleton() {
  return (
    <main className={pageStyles.main}>
      <div className={pageStyles.header}>
        <div className={styles.skHeaderIcon} />
        <div className={styles.skTitle} />
      </div>

      <div className={pageStyles.grid}>
        <div className={styles.skNewsCard} />
        <div className={styles.skNewsCard} />
        <div className={styles.skNewsCard} />
        <div className={styles.skNewsCard} />
        <div className={styles.skNewsCard} />
        <div className={styles.skNewsCard} />
      </div>
    </main>
  );
}
