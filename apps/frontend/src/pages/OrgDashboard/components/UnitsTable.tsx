import { ChevronDown, Star } from "lucide-react";
import type { OrgUnitStat } from "../../../api/dashboardApi";
import pageStyles from "../OrgDashboardPage.module.css";
import styles from "./UnitsTable.module.css";

interface UnitsTableProps {
  units: OrgUnitStat[];
  onSelectUnit: (unit: OrgUnitStat) => void;
}

export function UnitsTable({ units, onSelectUnit }: UnitsTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thCenter}>ลำดับ</th>
              <th>ชื่อกิจกรรม / บูธ</th>
              <th>ประเภท</th>
              <th className={styles.thRight}>ยอด Check-in</th>
              <th className={styles.thRight}>คะแนน (Rating)</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit, idx) => (
              <tr
                key={unit.id}
                className={styles.clickableRow}
                onClick={() => onSelectUnit(unit)}
              >
                <td className={styles.tdCenter}>{idx + 1}</td>
                <td className={styles.unitName}>{unit.name}</td>
                <td>
                  <span
                    className={`${pageStyles.typeBadge} ${
                      unit.type === "activity" ? pageStyles.typeActivity : pageStyles.typeBooth
                    }`}
                  >
                    {unit.type === "activity" ? "กิจกรรม" : "บูธ"}
                  </span>
                </td>
                <td className={styles.tdRight}>
                  <strong>{unit.checkins.toLocaleString()}</strong>
                  <span className={styles.tdSub}> ครั้ง</span>
                </td>
                <td className={styles.tdRight}>
                  <span className={styles.ratingCell}>
                    {unit.rating.toFixed(2)}
                    <Star
                      size={14}
                      className={unit.rating >= 4.5 ? styles.starFilled : styles.starEmpty}
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile accordion cards */}
      <div className={styles.mobileCards}>
        {units.map((unit, idx) => (
          <details key={unit.id} className={styles.mobileCard}>
            <summary className={styles.mobileCardHeader}>
              <span className={styles.mobileCardRank}>{idx + 1}</span>
              <span className={styles.mobileCardName}>{unit.name}</span>
              <span
                className={`${pageStyles.typeBadge} ${
                  unit.type === "activity" ? pageStyles.typeActivity : pageStyles.typeBooth
                }`}
              >
                {unit.type === "activity" ? "กิจกรรม" : "บูธ"}
              </span>
              <ChevronDown size={16} className={styles.chevronIcon} />
            </summary>
            <div className={styles.mobileCardBody}>
              <div className={styles.mobileCardRow}>
                <span className={styles.mobileCardLabel}>Check-in</span>
                <span>{unit.checkins.toLocaleString()} ครั้ง</span>
              </div>
              <div className={styles.mobileCardRow}>
                <span className={styles.mobileCardLabel}>Rating</span>
                <span>{unit.rating.toFixed(2)} / 5</span>
              </div>
              <button
                type="button"
                className={styles.mobileDetailBtn}
                onClick={() => onSelectUnit(unit)}
              >
                ดูรายละเอียด
              </button>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
