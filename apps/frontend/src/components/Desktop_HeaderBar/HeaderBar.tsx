import { useId, useRef } from "react";
import { UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./HeaderBar.module.css";

type TabId = "exhibition" | "activity" | "summary";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "exhibition", label: "นิทรรศการ" },
  { id: "activity", label: "กิจกรรม" },
  { id: "summary", label: "สรุปข้อมูล" },
];

export default function HeaderBar({
  active = "exhibition",
  onLoginClick,
}: {
  active?: TabId;
  onLoginClick?: () => void;
}) {
  const navigate = useNavigate();
  const toggleRef = useRef<HTMLInputElement>(null);
  const toggleId = useId().replace(/:/g, "-");
  const navId = `${toggleId}-nav`;

  const closeMenu = () => {
    if (toggleRef.current?.checked) {
      toggleRef.current.checked = false;
    }
  };

  const handleTabClick = (id: TabId) => {
    if (id === "exhibition") {
      navigate("/exhibitions");
    }

    if (id === "activity") {
      navigate("/activities");
    }

    closeMenu();
  };

  const handleLoginClick = () => {
    closeMenu();
    onLoginClick?.();
  };

  return (
    <header className={styles.bar}>
      <div className={styles.row}>
        <input
          ref={toggleRef}
          type="checkbox"
          id={toggleId}
          className={styles.toggle}
          aria-label="Toggle navigation menu"
          aria-controls={navId}
        />
        <label htmlFor={toggleId} className={styles.hamburger} aria-hidden="true">
          <span className={styles.hamburgerBar} />
          <span className={styles.hamburgerBar} />
          <span className={styles.hamburgerBar} />
        </label>
        <div className={styles.left}>Exhibition Management System</div>
        <nav className={styles.tabs} id={navId} aria-label="Main navigation">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab}${
                active === tab.id ? ` ${styles.tabActive}` : ""
              }`}
              onClick={() => handleTabClick(tab.id)}
              aria-current={active === tab.id ? "page" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className={styles.right}>
          <button
            type="button"
            className={styles.login}
            onClick={handleLoginClick}
            aria-label="Account menu"
          >
            <UserCircle size={22} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
