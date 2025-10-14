import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./HeaderBar.module.css";

// เพิ่ม "home" เข้ามาใน type
type TabId = "home" | "exhibition" | "unit" | "summary";

// เพิ่มแท็บ "หน้าแรก"
const TABS: Array<{ id: TabId; label: string }> = [
  { id: "exhibition", label: "นิทรรศการ" },
  { id: "unit", label: "กิจกรรม" },
  { id: "summary", label: "สรุปข้อมูล" },
];

export default function HeaderBar({
  active = "home",
  onLoginClick,
}: {
  active?: TabId;
  onLoginClick?: () => void;
}) {
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement | null>(null);
  const toggleRef = useRef<HTMLInputElement>(null);
  const toggleId = useId().replace(/:/g, "-");
  const navId = `${toggleId}-nav`;

  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    home: null,
    exhibition: null,
    unit: null,
    summary: null,
  });

  const indicatorTargetRef = useRef<TabId>(active);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  const updateIndicator = useCallback((tabId: TabId) => {
    indicatorTargetRef.current = tabId;
    const navEl = navRef.current;
    const tabEl = tabRefs.current[tabId];

    if (!navEl || !tabEl) {
      setIndicatorStyle({ width: 0, left: 0 });
      return;
    }

    const navRect = navEl.getBoundingClientRect();
    const tabRect = tabEl.getBoundingClientRect();

    setIndicatorStyle({
      width: tabRect.width,
      left: tabRect.left - navRect.left,
    });
  }, []);

  useLayoutEffect(() => {
    updateIndicator(active);
  }, [active, updateIndicator]);

  useEffect(() => {
    const handleResize = () => updateIndicator(indicatorTargetRef.current);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateIndicator]);

  const closeMenu = () => {
    if (toggleRef.current?.checked) toggleRef.current.checked = false;
  };

  const handleTabClick = (id: TabId) => {
    if (id === "home") navigate("/");
    if (id === "exhibition") navigate("/exhibitions");
    if (id === "unit") navigate("/units");
    if (id === "summary") navigate("/summary");
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
        <label
          htmlFor={toggleId}
          className={styles.hamburger}
          aria-hidden="true"
        >
          <span className={styles.hamburgerBar} />
          <span className={styles.hamburgerBar} />
          <span className={styles.hamburgerBar} />
        </label>

        <div
          className={styles.left}
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          Exhibition Management System
        </div>

        {/* เมนูหลัก */}
        <nav
          ref={navRef}
          className={styles.tabs}
          id={navId}
          aria-label="Main navigation"
          onMouseLeave={() => updateIndicator(active)}
        >
          {/* indicator bar */}
          <span
            className={styles.tabIndicator}
            style={{
              width: `${indicatorStyle.width}px`,
              transform: `translateX(${indicatorStyle.left}px)`,
              opacity: indicatorStyle.width ? 1 : 0,
            }}
            aria-hidden="true"
          />

          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab}${
                active === tab.id ? ` ${styles.tabActive}` : ""
              }`}
              onClick={() => handleTabClick(tab.id)}
              onMouseEnter={() => updateIndicator(tab.id)}
              onFocus={() => updateIndicator(tab.id)}
              onBlur={(event) => {
                const next = event.relatedTarget as Element | null;
                if (
                  !next ||
                  !event.currentTarget.parentElement?.contains(next)
                ) {
                  updateIndicator(active);
                }
              }}
              aria-current={active === tab.id ? "page" : undefined}
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ปุ่มผู้ใช้ */}
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
