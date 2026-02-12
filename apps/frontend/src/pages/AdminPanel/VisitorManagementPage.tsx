import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import type { Visitor } from "../../types/admin";
import AdminLayout from "./AdminLayout";
import VisitorDetail from "./VisitorDetail";
import { useVisitors } from "./hooks/useAdminVisitors";
import styles from "./VisitorManagementPage.module.css";

function roleClass(role: string | null) {
  switch (role) {
    case "staff":
      return styles.roleStaff;
    default:
      return styles.roleUser;
  }
}

export default function VisitorManagementPage() {
  const { data: visitors, isLoading, error } = useVisitors();
  const [search, setSearch] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  const filtered = useMemo(() => {
    if (!visitors) return [];
    const q = search.toLowerCase();
    if (!q) return visitors;
    return visitors.filter(
      (v) =>
        (v.full_name ?? "").toLowerCase().includes(q) ||
        (v.email ?? "").toLowerCase().includes(q) ||
        (v.phone ?? "").includes(q),
    );
  }, [visitors, search]);

  if (selectedVisitor) {
    return (
      <AdminLayout>
        <VisitorDetail
          visitor={selectedVisitor}
          onBack={() => setSelectedVisitor(null)}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="ค้นหาผู้เข้าชม..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && <p className={styles.loading}>กำลังโหลด...</p>}
      {error && (
        <p className={styles.error}>
          ไม่สามารถโหลดข้อมูลได้: {(error as Error).message}
        </p>
      )}

      {!isLoading && !error && (
        <>
          {/* Desktop table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ชื่อ</th>
                  <th>Email</th>
                  <th>เบอร์โทร</th>
                  <th>Role</th>
                  <th>ลงทะเบียน</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((v) => (
                    <tr
                      key={v.user_id}
                      className={styles.clickableRow}
                      onClick={() => setSelectedVisitor(v)}
                    >
                      <td>{v.full_name ?? "—"}</td>
                      <td>{v.email ?? "—"}</td>
                      <td>{v.phone ?? "—"}</td>
                      <td>
                        <span
                          className={`${styles.roleBadge} ${roleClass(v.role)}`}
                        >
                          {v.role ?? "user"}
                        </span>
                      </td>
                      <td className={styles.regCount}>
                        {v.registration_count}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className={styles.emptyRow}>
                    <td colSpan={5}>ไม่พบผู้เข้าชม</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className={styles.mobileCards}>
            {filtered.length > 0 ? (
              filtered.map((v) => (
                <details key={v.user_id} className={styles.card}>
                  <summary className={styles.cardHeader}>
                    <span className={styles.cardName}>
                      {v.full_name ?? "—"}
                    </span>
                    <span
                      className={`${styles.roleBadge} ${roleClass(v.role)}`}
                    >
                      {v.role ?? "user"}
                    </span>
                    <ChevronDown size={16} className={styles.chevron} />
                  </summary>
                  <div className={styles.cardBody}>
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Email</span>
                      <span>{v.email ?? "—"}</span>
                    </div>
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>เบอร์โทร</span>
                      <span>{v.phone ?? "—"}</span>
                    </div>
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>ลงทะเบียน</span>
                      <span className={styles.regCount}>
                        {v.registration_count}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.cardDetailBtn}
                      onClick={() => setSelectedVisitor(v)}
                    >
                      ดูรายละเอียด
                    </button>
                  </div>
                </details>
              ))
            ) : (
              <p className={styles.emptyCard}>ไม่พบผู้เข้าชม</p>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
