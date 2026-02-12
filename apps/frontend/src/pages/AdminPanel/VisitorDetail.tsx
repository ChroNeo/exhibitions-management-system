import { useState } from "react";
import { ArrowLeft, User } from "lucide-react";
import Swal from "sweetalert2";
import type { Visitor, VisitorExhibition } from "../../types/admin";
import { toggleCheckin as apiToggleCheckin } from "../../api/adminApi";
import { useQueryClient } from "@tanstack/react-query";
import {
  useVisitorDetail,
  useVisitorExhibitions,
  useUnitCheckins,
} from "./hooks/useAdminVisitors";
import styles from "./VisitorManagementPage.module.css";

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

export default function VisitorDetail({
  visitor,
  onBack,
}: {
  visitor: Visitor;
  onBack: () => void;
}) {
  const { data: detail } = useVisitorDetail(visitor.user_id);
  const { data: exhibitions, isLoading: exLoading } = useVisitorExhibitions(
    visitor.user_id,
  );
  const [selectedEx, setSelectedEx] = useState<VisitorExhibition | null>(null);

  if (selectedEx) {
    return (
      <CheckinView
        userId={visitor.user_id}
        exhibition={selectedEx}
        onBack={() => setSelectedEx(null)}
      />
    );
  }

  const info = detail ?? visitor;

  return (
    <div>
      <button className={styles.backButton} onClick={onBack}>
        <ArrowLeft size={18} />
        กลับ
      </button>

      <div className={styles.detailHeader}>
        {info.picture_url ? (
          <img src={info.picture_url} alt="" className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder}>
            <User size={28} />
          </div>
        )}
        <h2 className={styles.detailTitle}>{info.full_name ?? "—"}</h2>
      </div>

      <div className={styles.detailCard}>
        <h4 className={styles.sectionTitle}>ข้อมูลผู้เข้าชม</h4>
        <div className={styles.metaGrid}>
          <div>
            <span className={styles.metaLabel}>Email: </span>
            <span className={styles.metaValue}>{info.email ?? "—"}</span>
          </div>
          <div>
            <span className={styles.metaLabel}>เบอร์โทร: </span>
            <span className={styles.metaValue}>{info.phone ?? "—"}</span>
          </div>
          <div>
            <span className={styles.metaLabel}>Role: </span>
            <span className={styles.metaValue}>{info.role ?? "user"}</span>
          </div>
          {"gender" in info && (
            <div>
              <span className={styles.metaLabel}>เพศ: </span>
              <span className={styles.metaValue}>
                {(info as any).gender ?? "—"}
              </span>
            </div>
          )}
          {"birthdate" in info && (
            <div>
              <span className={styles.metaLabel}>วันเกิด: </span>
              <span className={styles.metaValue}>
                {(info as any).birthdate ?? "—"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.detailCard}>
        <h4 className={styles.sectionTitle}>นิทรรศการที่ลงทะเบียน</h4>
        {exLoading ? (
          <p className={styles.subEmpty}>กำลังโหลด...</p>
        ) : exhibitions && exhibitions.length > 0 ? (
          exhibitions.map((ex) => {
            const pct =
              ex.total_units > 0
                ? Math.round((ex.checked_in_units / ex.total_units) * 100)
                : 0;
            return (
              <div
                key={ex.exhibition_id}
                className={styles.exRow}
                onClick={() => setSelectedEx(ex)}
              >
                <div className={styles.exInfo}>
                  <div className={styles.exTitle}>{ex.title}</div>
                  <div className={styles.exMeta}>
                    {ex.exhibition_code} &middot; {ex.start_date} — {ex.end_date}
                  </div>
                  <div
                    className={styles.progressWrapper}
                    style={{ marginTop: 6 }}
                  >
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>
                      {ex.checked_in_units}/{ex.total_units}
                    </span>
                  </div>
                </div>
                <span
                  className={`${styles.statusBadge} ${statusClass(ex.status)}`}
                >
                  {ex.status ?? "draft"}
                </span>
              </div>
            );
          })
        ) : (
          <p className={styles.subEmpty}>ไม่มีนิทรรศการที่ลงทะเบียน</p>
        )}
      </div>
    </div>
  );
}

function CheckinView({
  userId,
  exhibition,
  onBack,
}: {
  userId: number;
  exhibition: VisitorExhibition;
  onBack: () => void;
}) {
  const { data: units, isLoading } = useUnitCheckins(
    userId,
    exhibition.exhibition_id,
  );
  const qc = useQueryClient();
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (unitId: number, unitName: string, isCheckedIn: boolean) => {
    const action = isCheckedIn ? "ยกเลิก Check-in" : "Check-in";
    const { isConfirmed } = await Swal.fire({
      title: `${action}`,
      text: `${action} "${unitName}" ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: action,
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: isCheckedIn ? "#ef4444" : "#2e4f8b",
    });

    if (!isConfirmed) return;

    Swal.fire({
      title: "กำลังดำเนินการ...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    setToggling(true);
    try {
      const result = await apiToggleCheckin(userId, exhibition.exhibition_id, unitId);
      await qc.invalidateQueries({
        queryKey: ["admin", "unit-checkins", userId, exhibition.exhibition_id],
      });
      qc.invalidateQueries({
        queryKey: ["admin", "visitor-exhibitions", userId],
      });
      Swal.fire({
        title: "สำเร็จ",
        text: result.checked_in ? "Check-in เรียบร้อย" : "ยกเลิก Check-in เรียบร้อย",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire("ผิดพลาด", (err as Error).message, "error");
    } finally {
      setToggling(false);
    }
  };

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
        <h4 className={styles.sectionTitle}>สถานะ Check-in</h4>
        {isLoading ? (
          <p className={styles.subEmpty}>กำลังโหลด...</p>
        ) : units && units.length > 0 ? (
          <table className={styles.checkinTable}>
            <thead>
              <tr>
                <th>ชื่อ Unit</th>
                <th>ประเภท</th>
                <th>เวลา Check-in</th>
                <th style={{ width: 120 }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.unit_id}>
                  <td>{u.unit_name}</td>
                  <td>
                    <span
                      className={`${styles.unitTypeBadge} ${
                        u.unit_type === "booth"
                          ? styles.typeBooth
                          : styles.typeActivity
                      }`}
                    >
                      {u.unit_type}
                    </span>
                  </td>
                  <td>{u.checkin_at ?? "—"}</td>
                  <td>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${
                        u.checked_in ? styles.checkedIn : styles.notCheckedIn
                      }`}
                      disabled={toggling}
                      onClick={() =>
                        handleToggle(u.unit_id, u.unit_name, u.checked_in)
                      }
                    >
                      {u.checked_in ? "Checked In" : "Check In"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.subEmpty}>ไม่มี Unit ในนิทรรศการนี้</p>
        )}
      </div>
    </div>
  );
}
