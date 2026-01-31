import { useNavigate } from "react-router-dom";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import AdminSidebar from "./AdminSidebar";
import styles from "./AdminLayout.module.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <>
      <HeaderBar active="admin" onLoginClick={() => navigate("/login")} />
      <div className="container">
        <div className={styles.layout}>
          <AdminSidebar />
          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </>
  );
}
