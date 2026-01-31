import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { fetchUnits } from "../../api/units";
import AdminLayout from "./AdminLayout";
import {
  useAdminExhibitions,
  useExhibitionRegistrations,
} from "./hooks/useAdminDashboard";
import styles from "./AdminDashboardPage.module.css";

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
    case "draft": return styles.statusDraft;
    case "published": return styles.statusPublished;
    case "ongoing": return styles.statusOngoing;
    case "ended": return styles.statusEnded;
    case "archived": return styles.statusArchived;
    default: return styles.statusDraft;
  }
}

export default function AdminDashboardPage() {
  const { data: exhibitions, isLoading, error } = useAdminExhibitions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

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

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

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
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 32 }} />
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
                  <>
                    <tr
                      key={ex.exhibition_id}
                      className={styles.clickableRow}
                      onClick={() => toggleExpand(ex.exhibition_id)}
                    >
                      <td>
                        {expandedId === ex.exhibition_id ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </td>
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
                        {ex.start_date} — {ex.end_date}
                      </td>
                      <td>{ex.location ?? "—"}</td>
                      <td className={styles.regCount}>
                        {ex.total_registrations}
                      </td>
                    </tr>
                    {expandedId === ex.exhibition_id && (
                      <tr
                        key={`detail-${ex.exhibition_id}`}
                        className={styles.expandedRow}
                      >
                        <td colSpan={7}>
                          <ExpandedDetail exhibition={ex} />
                        </td>
                      </tr>
                    )}
                  </>
                ))
              ) : (
                <tr className={styles.emptyRow}>
                  <td colSpan={7}>ไม่พบนิทรรศการ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

function ExpandedDetail({
  exhibition,
}: {
  exhibition: { exhibition_id: number; organizer_name: string; start_date: string; end_date: string; location: string | null };
}) {
  const { data: registrations, isLoading: regLoading } =
    useExhibitionRegistrations(exhibition.exhibition_id);

  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ["admin", "units", exhibition.exhibition_id],
    queryFn: () => fetchUnits(exhibition.exhibition_id),
  });

  return (
    <div className={styles.expandedContent}>
      {/* Metadata */}
      <h4 className={styles.sectionTitle}>ข้อมูลนิทรรศการ</h4>
      <div className={styles.metaGrid}>
        <div>
          <span className={styles.metaLabel}>ผู้จัด: </span>
          <span className={styles.metaValue}>{exhibition.organizer_name}</span>
        </div>
        <div>
          <span className={styles.metaLabel}>สถานที่: </span>
          <span className={styles.metaValue}>{exhibition.location ?? "—"}</span>
        </div>
        <div>
          <span className={styles.metaLabel}>เริ่ม: </span>
          <span className={styles.metaValue}>{exhibition.start_date}</span>
        </div>
        <div>
          <span className={styles.metaLabel}>สิ้นสุด: </span>
          <span className={styles.metaValue}>{exhibition.end_date}</span>
        </div>
      </div>

      {/* Units */}
      <h4 className={styles.sectionTitle}>หน่วยกิจกรรม / บูธ</h4>
      {unitsLoading ? (
        <p className={styles.subEmpty}>กำลังโหลด...</p>
      ) : units && units.length > 0 ? (
        <table className={styles.subTable}>
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>ประเภท</th>
              <th>Staff</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>
                  <span
                    className={`${styles.unitTypeBadge} ${
                      u.type === "booth" ? styles.typeBooth : styles.typeActivity
                    }`}
                  >
                    {u.type}
                  </span>
                </td>
                <td>{u.staffNames.length > 0 ? u.staffNames.join(", ") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={styles.subEmpty}>ไม่มีหน่วยกิจกรรม</p>
      )}

      {/* Registrations */}
      <h4 className={styles.sectionTitle}>รายชื่อผู้ลงทะเบียน</h4>
      {regLoading ? (
        <p className={styles.subEmpty}>กำลังโหลด...</p>
      ) : registrations && registrations.length > 0 ? (
        <table className={styles.subTable}>
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>Email</th>
              <th>เบอร์โทร</th>
              <th>Role</th>
              <th>ลงทะเบียนเมื่อ</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r.registration_id}>
                <td>{r.user_name ?? "—"}</td>
                <td>{r.email ?? "—"}</td>
                <td>{r.phone ?? "—"}</td>
                <td>{r.role ?? "—"}</td>
                <td>{r.registered_at ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={styles.subEmpty}>ไม่มีผู้ลงทะเบียน</p>
      )}
    </div>
  );
}
