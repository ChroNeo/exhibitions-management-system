import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { LogOut, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./HeaderBar.module.css";
import { clearAuth } from "../../utils/authStorage";
import { useAuthStatus, useAuthUser } from "../../hooks";

// เพิ่ม "home" เข้ามาใน type
type TabId = "home" | "exhibition_unit" | "admin";

// เพิ่มแท็บ "หน้าแรก"
const TABS: Array<{ id: TabId; label: string }> = [
  { id: "exhibition_unit", label: "นิทรรศการ & กิจกรรม" },
];


export default function HeaderBar({
  active = "home",
  onLoginClick,
  onLogoutClick,
}: {
  active?: TabId;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
}) {
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement | null>(null);
  const toggleRef = useRef<HTMLInputElement>(null);
  const toggleId = useId().replace(/:/g, "-");
  const navId = `${toggleId}-nav`;

  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    home: null,
    exhibition_unit: null,
    admin: null,
  });

  const indicatorTargetRef = useRef<TabId>(active);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
  const hasAuth = useAuthStatus();
  const user = useAuthUser();
  const visibleTabs = hasAuth
    ? user?.role === "admin"
      ? [...TABS, { id: "admin" as TabId, label: "แผงควบคุม" }]
      : TABS
    : [];

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
    if (id === "exhibition_unit") navigate("/exhibitions");
    if (id === "admin") navigate("/admin");
    closeMenu();
  };

  const handleLoginClick = () => {
    closeMenu();

    if (hasAuth) {
      clearAuth();
      onLogoutClick?.();
      if (!onLogoutClick) {
        navigate("/");
      }
      return;
    }

    if (onLoginClick) {
      onLoginClick();
    } else {
      navigate("/login");
    }
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
          className={styles.brand}
          onClick={() => navigate("/")}
        >
          <svg
            className={styles.logo}
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="2" y="2" width="28" height="28" rx="6" fill="#2E4F8B" />
            <rect x="6" y="6" width="5.5" height="5.5" rx="1.2" fill="#fff" opacity="0.92" />
            <rect x="13.25" y="6" width="5.5" height="5.5" rx="1.2" fill="#fff" opacity="0.75" />
            <rect x="20.5" y="6" width="5.5" height="5.5" rx="1.2" fill="#fff" opacity="0.92" />
            <rect x="6" y="13.25" width="5.5" height="5.5" rx="1.2" fill="#fff" opacity="0.75" />
            <rect x="13.25" y="13.25" width="5.5" height="5.5" rx="1.2" fill="#fff" opacity="0.95" />
            <rect x="20.5" y="13.25" width="5.5" height="5.5" rx="1.2" fill="#fff" opacity="0.75" />
            <rect x="6" y="20.5" width="5.5" height="5.5" rx="1.2" fill="#fff" opacity="0.92" />
            <rect x="13.25" y="20.5" width="5.5" height="5.5" rx="1.2" fill="#fff" opacity="0.75" />
            <rect x="20.5" y="20.5" width="5.5" height="5.5" rx="1.2" fill="#fff" opacity="0.92" />
          </svg>
          <span className={styles.brandText}>Exhibition Management</span>
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

          {visibleTabs.map((tab) => (
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
            aria-label={hasAuth ? "Logout" : "Account menu"}
          >
            {hasAuth ? (
              <LogOut size={22} aria-hidden="true" />
            ) : (
              <UserCircle size={22} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

