import { Activity, ArrowLeft, MessageCircle, QrCode, Star } from "lucide-react";
import type { OrgUnitStat } from "../../../api/dashboardApi";
import pageStyles from "../OrgDashboardPage.module.css";
import { KpiCard, kpiStyles } from "./KpiCard";
import { ProgressBar, progressStyles } from "./ProgressBar";
import styles from "./UnitDetail.module.css";

interface UnitDetailProps {
  unit: OrgUnitStat;
  onBack: () => void;
}

export function UnitDetail({ unit, onBack }: UnitDetailProps) {
  return (
    <div className={pageStyles.page}>
      <button className={styles.backBtn} onClick={onBack} type="button">
        <ArrowLeft size={18} />
        กลับไปหน้าภาพรวมงาน
      </button>

      <header className={styles.unitHeader}>
        <div className={styles.unitMeta}>
          <span
            className={`${pageStyles.typeBadge} ${
              unit.type === "activity" ? pageStyles.typeActivity : pageStyles.typeBooth
            }`}
          >
            {unit.type === "activity" ? "กิจกรรม (Activity)" : "บูธ (Booth)"}
          </span>
          <span className={styles.unitId}>Unit ID: {unit.id}</span>
        </div>
        <h1 className={styles.unitTitle}>{unit.name}</h1>
      </header>

      <div className={kpiStyles.kpiGrid}>
        <KpiCard
          title="ยอด Check-in ของบูธนี้"
          value={unit.checkins.toLocaleString()}
          icon={QrCode}
          colorKey="emerald"
        />
        <KpiCard
          title="คะแนนประเมิน (Rating)"
          value={`${unit.rating.toFixed(2)} / 5`}
          icon={Star}
          colorKey="amber"
        />
      </div>

      <div className={styles.twoCol}>
        {/* Score breakdown */}
        <div className={pageStyles.card}>
          <h2 className={pageStyles.cardTitle}>
            <Activity size={18} className={pageStyles.iconIndigo} />
            รายละเอียดคะแนนรายข้อ
          </h2>
          <div className={progressStyles.progressList}>
            {unit.feedback_details.length > 0 ? (
              unit.feedback_details.map((item, idx) => (
                <ProgressBar
                  key={idx}
                  label={item.topic}
                  value={item.score}
                  max={5}
                  suffix=" ดาว"
                />
              ))
            ) : (
              <p className={pageStyles.empty}>ยังไม่มีข้อมูลคะแนน</p>
            )}
          </div>
        </div>

        {/* Recent comments */}
        <div className={pageStyles.card}>
          <h2 className={pageStyles.cardTitle}>
            <MessageCircle size={18} className={pageStyles.iconPink} />
            ความคิดเห็นล่าสุดจากผู้เข้าร่วม
          </h2>
          <div className={styles.commentList}>
            {unit.recent_comments.length > 0 ? (
              unit.recent_comments.map((c, idx) => (
                <div key={idx} className={styles.commentItem}>
                  "{c}"
                </div>
              ))
            ) : (
              <p className={pageStyles.empty}>ยังไม่มีความคิดเห็น</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
