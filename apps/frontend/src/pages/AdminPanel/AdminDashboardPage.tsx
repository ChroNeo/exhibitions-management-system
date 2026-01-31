import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { fmtDateTimeRangeTH } from "../../utils/dateFormat";
import styles from "./AdminDashboardPage.module.css";
import AdminLayout from "./AdminLayout";
import ExhibitionDetail, { type Exhibition } from "./ExhibitionDetail";
import { useAdminExhibitions } from "./hooks/useAdminDashboard";

const STATUS_OPTIONS = [
  { value: "", label: "ทุกสถานะ" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "ongoing", label: "Ongoing" },
  { value: "ended", label: "Ended" },
  { value: "archived", label: "Archived" },
];

function statusClass(status: string | null) {
  switch (status) {
    case "draft":
      return styles.statusDraft;
    case "published":
      return styles.statusPublished;
    case "ongoing":
      return styles.statusOngoing;
    case "ended":
      return styles.statusEnded;
    case "archived":
      return styles.statusArchived;
    default:
      return styles.statusDraft;
  }
}

export default function AdminDashboardPage() {
  const { data: exhibitions, isLoading, error } = useAdminExhibitions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedExhibition, setSelectedExhibition] =
    useState<Exhibition | null>(null);

  const filtered = useMemo(() => {
    if (!exhibitions) return [];
    return exhibitions.filter((ex) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        ex.title.toLowerCase().includes(q) ||
        ex.exhibition_code.toLowerCase().includes(q) ||
        (ex.location ?? "").toLowerCase().includes(q);
      const matchStatus = !statusFilter || ex.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [exhibitions, search, statusFilter]);

  if (selectedExhibition) {
    return (
      <AdminLayout>
        <ExhibitionDetail
          exhibition={selectedExhibition}
          onBack={() => setSelectedExhibition(null)}
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
          placeholder="ค้นหานิทรรศการ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.statusFilter}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className={styles.loading}>กำลังโหลด...</p>}
      {error && (
        <p className={styles.error}>
          ไม่สามารถโหลดข้อมูลได้: {(error as Error).message}
        </p>
      )}

      {!isLoading && !error && (
        <>
          {/* Desktop / Tablet table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>ชื่อนิทรรศการ</th>
                  <th>สถานะ</th>
                  <th>วันที่</th>
                  <th>สถานที่</th>
                  <th>ผู้ลงทะเบียน</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((ex) => (
                    <tr
                      key={ex.exhibition_id}
                      className={styles.clickableRow}
                      onClick={() => setSelectedExhibition(ex)}
                    >
                      <td>{ex.exhibition_code}</td>
                      <td>{ex.title}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${statusClass(ex.status)}`}
                        >
                          {ex.status ?? "draft"}
                        </span>
                      </td>
                      <td>
                        <span>
                          {fmtDateTimeRangeTH(ex.start_date, ex.end_date)}
                        </span>
                      </td>
                      <td>{ex.location ?? "—"}</td>
                      <td className={styles.regCount}>
                        {ex.total_registrations}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className={styles.emptyRow}>
                    <td colSpan={6}>ไม่พบนิทรรศการ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile accordion cards */}
          <div className={styles.mobileCards}>
            {filtered.length > 0 ? (
              filtered.map((ex) => (
                <details key={ex.exhibition_id} className={styles.card}>
                  <summary className={styles.cardHeader}>
                    <span className={styles.cardName}>{ex.title}</span>
                    <span
                      className={`${styles.statusBadge} ${statusClass(ex.status)}`}
                    >
                      {ex.status ?? "draft"}
                    </span>
                    <ChevronDown size={16} className={styles.chevron} />
                  </summary>
                  <div className={styles.cardBody}>
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Code</span>
                      <span>{ex.exhibition_code}</span>
                    </div>
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>วันที่</span>
                      <span>{fmtDateTimeRangeTH(ex.start_date, ex.end_date)}</span>
                    </div>
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>สถานที่</span>
                      <span>{ex.location ?? "—"}</span>
                    </div>
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>ผู้ลงทะเบียน</span>
                      <span className={styles.regCount}>{ex.total_registrations}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.cardDetailBtn}
                      onClick={() => setSelectedExhibition(ex)}
                    >
                      ดูรายละเอียด
                    </button>
                  </div>
                </details>
              ))
            ) : (
              <p className={styles.emptyCard}>ไม่พบนิทรรศการ</p>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
