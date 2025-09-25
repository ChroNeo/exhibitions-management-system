import styles from './HeaderBar.module.css';

export default function HeaderBar({
  active = 'exhibition',
  onTab,
  onLoginClick,
}: {
  active?: 'exhibition' | 'activity' | 'summary';
  onTab?: (t: string) => void;
  onLoginClick?: () => void;
}) {
  const Tab = ({ id, label }: { id: string; label: string }) => (
    <div
      className={`${styles.tab} ${active === id ? styles.active : ''}`}
      onClick={() => onTab?.(id)}
    >
      {label}
    </div>
  );

  return (
    <header className={styles.bar}>
      <div className={styles.row}>
        <div className={styles.left}>Exhibition Management System</div>
        <nav className={styles.tabs}>
          <Tab id="exhibition" label="นิทรรศการ" />
          <Tab id="activity" label="กิจกรรม" />
          <Tab id="summary" label="สรุปข้อมูล" />
        </nav>
        <div className={styles.right}>
          <button
            className={styles.createBtn}
            onClick={() => console.log('create exhibition')}
          >
            + สร้างนิทรรศการ
          </button>
          <div
            className={styles.login}
            onClick={onLoginClick}
            role="button"
            tabIndex={0}
          >
            <div className={styles.avatar} />
            <span>Admin 01</span>
          </div>
        </div>
      </div>
    </header>
  );
}
