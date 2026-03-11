import {
  ArrowLeft,
  MessageCircle,
  MessageSquare,
  QrCode,
  Star,
  Users,
} from "lucide-react";
import { Radar } from "react-chartjs-2";
import type { OrgUnitStat } from "../../../api/dashboardApi";
import "../ChartSetup";
import pageStyles from "../OrgDashboardPage.module.css";
import { useStaffDashboard } from "../hooks/useStaffDashboard";
import { KpiCard, kpiStyles } from "./KpiCard";
import styles from "./UnitDetail.module.css";

interface UnitDetailProps {
  unit: OrgUnitStat;
  exhibitionId: number;
  onBack: () => void;
}

export function UnitDetail({ unit, exhibitionId, onBack }: UnitDetailProps) {
  const { data, isLoading, error } = useStaffDashboard(exhibitionId, unit.id);

  const feedbackItems = data?.feedback_breakdown ?? [];
  const radarChartData = {
    labels:
      feedbackItems.length > 0
        ? feedbackItems.map((f) => f.topic)
        : unit.feedback_details.map((f) => f.topic),
    datasets: [
      {
        label: "คะแนนเฉลี่ย",
        data:
          feedbackItems.length > 0
            ? feedbackItems.map((f) => f.score)
            : unit.feedback_details.map((f) => f.score),
        backgroundColor: "#3b82f622",
        borderColor: "#3b82f6",
        pointBackgroundColor: "#3b82f6",
        borderWidth: 2,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        ticks: { stepSize: 1, font: { size: 11 } },
        pointLabels: { font: { size: 12 } },
      },
    },
    plugins: { legend: { display: false } },
  };

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
              unit.type === "activity"
                ? pageStyles.typeActivity
                : pageStyles.typeBooth
            }`}
          >
            {unit.type === "activity" ? "กิจกรรม (Activity)" : "บูธ (Booth)"}
          </span>
          <span className={styles.unitId}>Unit ID: {unit.id}</span>
        </div>
        <h1 className={styles.unitTitle}>{unit.name}</h1>
      </header>

      {/* KPIs */}
      <div className={kpiStyles.kpiGrid}>
        <KpiCard
          title="ยอด Check-in ทั้งหมด"
          value={(data?.stats.total_checkins ?? unit.checkins).toLocaleString()}
          icon={QrCode}
          colorKey="emerald"
          subtitle="ผู้เข้าร่วมที่สแกนแล้ว"
        />
        <KpiCard
          title="รีวิวทั้งหมด"
          value={isLoading ? "..." : String(data?.stats.total_reviews ?? "—")}
          icon={MessageSquare}
          colorKey="blue"
        />
        <KpiCard
          title="คะแนนเฉลี่ย"
          value={
            data
              ? `${data.stats.average_rating} / 5`
              : `${unit.rating.toFixed(2)} / 5`
          }
          icon={Star}
          colorKey="amber"
        />
        <KpiCard
          title="เจ้าหน้าที่"
          value={isLoading ? "..." : (data?.staff_info.name ?? "—")}
          icon={Users}
          colorKey="indigo"
        />
      </div>

      {error && (
        <p className={pageStyles.empty} style={{ marginBottom: 16 }}>
          ไม่สามารถโหลดข้อมูลสถิติเพิ่มเติมได้
        </p>
      )}

      {/* Feedback Radar — matches UnitDashboardPage */}
      {(feedbackItems.length > 0 || unit.feedback_details.length > 0) && (
        <div className={pageStyles.card}>
          <h2 className={pageStyles.cardTitle}>
            <MessageSquare size={18} className={pageStyles.iconBlue} />
            เจาะลึกคะแนนประเมิน (Feedback Breakdown)
          </h2>
          <div className={styles.chartWrapperLarge}>
            <Radar data={radarChartData} options={radarOptions} />
          </div>
          <div className={styles.scoreLegend}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.fillGreen}`} />
              ยอดเยี่ยม (4.5 – 5.0)
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.fillAmber}`} />
              ปานกลาง (4.0 – 4.4)
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.fillRed}`} />
              ต้องปรับปรุง (&lt; 4.0)
            </div>
          </div>
        </div>
      )}

      {/* Feedback list — topic scores with response count */}
      {(feedbackItems.length > 0 || unit.feedback_details.length > 0) && (
        <div className={pageStyles.card}>
          <h2 className={pageStyles.cardTitle}>
            <Star size={18} className={pageStyles.iconMuted} />
            คะแนนรายหัวข้อ
          </h2>
          <ul className={styles.feedbackList}>
            {(feedbackItems.length > 0
              ? feedbackItems
              : unit.feedback_details
            ).map((item, idx) => (
              <li key={idx} className={styles.feedbackItem}>
                <div className={styles.feedbackLeft}>
                  <div className={styles.feedbackTopic}>{item.topic}</div>
                  {"response_count" in item && (
                    <div className={styles.feedbackMeta}>
                      {(item as { response_count: number }).response_count} คน
                    </div>
                  )}
                </div>
                <div className={styles.feedbackScore}>⭐ {item.score}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent comments */}
      <div className={pageStyles.card}>
        <h2 className={pageStyles.cardTitle}>
          <MessageCircle size={18} className={pageStyles.iconPink} />
          ความคิดเห็นล่าสุด
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

      {/* Unit info from staff dashboard */}
      {data && (
        <div className={pageStyles.card}>
          <h2 className={pageStyles.cardTitle}>
            <QrCode size={18} className={pageStyles.iconIndigo} />
            ข้อมูลบูธ / กิจกรรม
          </h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>รหัส</span>
              <span>{data.unit_detail.code}</span>
            </div>
            {data.unit_detail.schedule?.starts_at && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>ช่วงเวลา</span>
                <span>
                  {new Date(data.unit_detail.schedule.starts_at).toLocaleString(
                    "th-TH",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    },
                  )}
                  {" – "}
                  {new Date(data.unit_detail.schedule.ends_at).toLocaleString(
                    "th-TH",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    },
                  )}
                </span>
              </div>
            )}
            {data.unit_detail.description && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>คำอธิบาย</span>
                <span>{data.unit_detail.description}</span>
              </div>
            )}
          </div>
          {(data.unit_detail.poster_url || data.unit_detail.detail_pdf_url) && (
            <div className={styles.actionRow}>
              {data.unit_detail.poster_url && (
                <a
                  className={styles.actionBtn}
                  href={data.unit_detail.poster_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  🖼️ Poster
                </a>
              )}
              {data.unit_detail.detail_pdf_url && (
                <a
                  className={styles.actionBtn}
                  href={data.unit_detail.detail_pdf_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  📄 PDF
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
