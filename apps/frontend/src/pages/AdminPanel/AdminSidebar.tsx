import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Users } from "lucide-react";
import styles from "./AdminSidebar.module.css";

const NAV_ITEMS = [
  { path: "/admin", label: "แดชบอร์ด", icon: LayoutDashboard },
  { path: "/admin/users", label: "จัดการผู้ใช้", icon: Users },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className={styles.sidebar}>
      <ul className={styles.navList}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.path);

          return (
            <li key={item.path} className={styles.navItem}>
              <button
                type="button"
                className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
