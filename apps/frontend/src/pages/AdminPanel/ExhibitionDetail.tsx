import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { fetchUnits } from "../../api/units";
import { useExhibitionRegistrations } from "./hooks/useAdminDashboard";
import styles from "./AdminDashboardPage.module.css";

function roleClass(role: string | null) {
  switch (role) {
    case "user": return styles.roleUser;
    case "staff": return styles.roleStaff;
    default: return styles.roleUser;
  }
}

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

export type Exhibition = {
  exhibition_id: number;
  exhibition_code: string;
  title: string;
  status: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  total_registrations: number;
  organizer_name: string;
};

export default function ExhibitionDetail({
  exhibition,
  onBack,
}: {
  exhibition: Exhibition;
  onBack: () => void;
}) {
  const { data: registrations, isLoading: regLoading } =
    useExhibitionRegistrations(exhibition.exhibition_id);

  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ["admin", "units", exhibition.exhibition_id],
    queryFn: () => fetchUnits(exhibition.exhibition_id),
  });

  return (
    <div>
      <button className={styles.backButton} onClick={onBack}>
        <ArrowLeft size={18} />
        กลับ
      </button>

      <div className={styles.detailHeader}>
        <h2 className={styles.detailTitle}>{exhibition.title}</h2>
        <span
          className={`${styles.statusBadge} ${statusClass(exhibition.status)}`}
        >
          {exhibition.status ?? "draft"}
        </span>
      </div>

      <div className={styles.detailCard}>
        <h4 className={styles.sectionTitle}>ข้อมูลนิทรรศการ</h4>
        <div className={styles.metaGrid}>
          <div>
            <span className={styles.metaLabel}>Code: </span>
            <span className={styles.metaValue}>{exhibition.exhibition_code}</span>
          </div>
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
      </div>

      <div className={styles.detailCard}>
        <h4 className={styles.sectionTitle}>หน่วยกิจกรรม / บูธ</h4>
        {unitsLoading ? (
          <p className={styles.subEmpty}>กำลังโหลด...</p>
        ) : units && units.length > 0 ? (
          <>
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
            <div className={styles.subMobileCards}>
              {units.map((u) => (
                <details key={u.id} className={styles.subCard}>
                  <summary className={styles.subCardHeader}>
                    <span className={styles.subCardName}>{u.name}</span>
                    <span
                      className={`${styles.unitTypeBadge} ${
                        u.type === "booth" ? styles.typeBooth : styles.typeActivity
                      }`}
                    >
                      {u.type}
                    </span>
                    <ChevronDown size={14} className={styles.chevron} />
                  </summary>
                  <div className={styles.subCardBody}>
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Staff</span>
                      <span>{u.staffNames.length > 0 ? u.staffNames.join(", ") : "—"}</span>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </>
        ) : (
          <p className={styles.subEmpty}>ไม่มีหน่วยกิจกรรม</p>
        )}
      </div>

      <div className={styles.detailCard}>
        <h4 className={styles.sectionTitle}>รายชื่อผู้ลงทะเบียน</h4>
        {regLoading ? (
          <p className={styles.subEmpty}>กำลังโหลด...</p>
        ) : registrations && registrations.length > 0 ? (
          <>
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
                    <td>
                      <span className={`${styles.roleBadge} ${roleClass(r.role)}`}>
                        {r.role ?? "—"}
                      </span>
                    </td>
                    <td>{r.registered_at ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.subMobileCards}>
              {registrations.map((r) => (
                <details key={r.registration_id} className={styles.subCard}>
                  <summary className={styles.subCardHeader}>
                    <span className={styles.subCardName}>{r.user_name ?? "—"}</span>
                    <span className={`${styles.roleBadge} ${roleClass(r.role)}`}>{r.role ?? "—"}</span>
                    <ChevronDown size={14} className={styles.chevron} />
                  </summary>
                  <div className={styles.subCardBody}>
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Email</span>
                      <span>{r.email ?? "—"}</span>
                    </div>
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>เบอร์โทร</span>
                      <span>{r.phone ?? "—"}</span>
                    </div>
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>ลงทะเบียนเมื่อ</span>
                      <span>{r.registered_at ?? "—"}</span>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </>
        ) : (
          <p className={styles.subEmpty}>ไม่มีผู้ลงทะเบียน</p>
        )}
      </div>
    </div>
  );
}
