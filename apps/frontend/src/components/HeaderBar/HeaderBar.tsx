import { LogOut, Menu, UserCircle, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStatus, useAuthUser } from "../../hooks";
import { clearAuth } from "../../utils/authStorage";
import styles from "./HeaderBar.module.css";

type TabId = "home" | "exhibition_unit" | "dashboard" | "admin";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "exhibition_unit", label: "นิทรรศการ & กิจกรรม" },
  { id: "dashboard", label: "Dashboard" },
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
  const hasAuth = useAuthStatus();
  const user = useAuthUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleTabs = hasAuth
    ? user?.role === "admin"
      ? [...TABS, { id: "admin" as TabId, label: "แผงควบคุม" }]
      : TABS
    : [];

  const handleTabClick = useCallback(
    (id: TabId) => {
      if (id === "home") navigate("/");
      if (id === "exhibition_unit") navigate("/exhibitions");
      if (id === "dashboard") navigate("/dashboard/selector");
      if (id === "admin") navigate("/admin");
      setMobileOpen(false);
    },
    [navigate],
  );

  const handleLoginClick = useCallback(() => {
    setMobileOpen(false);
    if (hasAuth) {
      clearAuth();
      onLogoutClick?.();
      if (!onLogoutClick) navigate("/");
      return;
    }
    if (onLoginClick) onLoginClick();
    else navigate("/login");
  }, [hasAuth, navigate, onLoginClick, onLogoutClick]);

  const userInitial = user?.username?.[0]?.toUpperCase() ?? "A";

  return (
    <>
      <header className={styles.bar}>
        <div className={styles.row}>
          {/* Brand */}
          <div className={styles.brand} onClick={() => navigate("/")}>
            <div className={styles.brandIcon}>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="12" height="12" rx="2" />
                <path d="M2 7h12M7 2v12" />
              </svg>
            </div>
            <span className={styles.brandText}>Exhibition Management</span>
          </div>

          {/* Desktop nav links */}
          <div className={styles.navLinks}>
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.navLink}${active === tab.id ? ` ${styles.navLinkActive}` : ""}`}
                onClick={() => handleTabClick(tab.id)}
              >
                {tab.label}
              </button>
            ))}
            {hasAuth ? (
              <div
                className={styles.avatar}
                onClick={handleLoginClick}
                title="ออกจากระบบ"
              >
                {userInitial}
              </div>
            ) : (
              <button
                type="button"
                className={styles.navLink}
                onClick={handleLoginClick}
              >
                <UserCircle size={20} />
              </button>
            )}
          </div>

          {/* Hamburger (mobile) */}
          <button
            type="button"
            className={styles.hamburger}
            onClick={() => setMobileOpen(true)}
            aria-label="เปิดเมนู"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile overlay + slide menu */}
      <div
        className={`${styles.overlay}${mobileOpen ? ` ${styles.overlayOpen}` : ""}`}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={`${styles.mobileMenu}${mobileOpen ? ` ${styles.mobileMenuOpen}` : ""}`}
      >
        <div className={styles.mobileHeader}>
          <h3 className={styles.mobileTitle}>เมนู</h3>
          <button
            type="button"
            className={styles.mobileClose}
            onClick={() => setMobileOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div className={styles.mobileLinks}>
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.mobileLink}${active === tab.id ? ` ${styles.mobileLinkActive}` : ""}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.mobileFooter}>
          {hasAuth ? (
            <button
              type="button"
              className={styles.mobileLink}
              onClick={handleLoginClick}
            >
              <LogOut size={18} />
              ออกจากระบบ
            </button>
          ) : (
            <button
              type="button"
              className={styles.mobileLink}
              onClick={handleLoginClick}
            >
              <UserCircle size={18} />
              เข้าสู่ระบบ
            </button>
          )}
        </div>
      </div>
    </>
  );
}
