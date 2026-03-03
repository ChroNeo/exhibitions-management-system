import { MessageSquare, QrCode, Star, Users } from "lucide-react";
import { Radar } from "react-chartjs-2";
import { useSearchParams } from "react-router-dom";
import "../../pages/OrgDashboard/ChartSetup";
import { KpiCard } from "../OrgDashboard/components/KpiCard";
import { UnitDashboardSkeleton } from "./components/UnitDashboardSkeleton";
import { useUnitDashboardLiff } from "./hooks/useUnitDashboardLiff";
import styles from "./UnitDashboardPage.module.css";

export default function UnitDashboardPage() {
  const [searchParams] = useSearchParams();
  const exId = searchParams.get("ex_id");
  const unitId = searchParams.get("unit_id");

  const { state, refetch } = useUnitDashboardLiff({ exId, unitId });

  if (state.status === "initializing" || state.status === "not_logged_in") {
    return <UnitDashboardSkeleton />;
  }

  if (state.status === "loading") {
    return <UnitDashboardSkeleton />;
  }

  if (state.status === "error") {
    return (
      <div className={styles.page}>
        <p className={styles.stateMsg}>{state.message}</p>
        <button onClick={refetch}>ลองใหม่</button>
      </div>
    );
  }

  if (state.status !== "success") return null;

  const d = state.data;

  const radarChartData = {
    labels: d.feedback_breakdown.map((f) => f.topic),
    datasets: [
      {
        label: "คะแนนเฉลี่ย",
        data: d.feedback_breakdown.map((f) => f.score),
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

  const statusLabel: Record<string, string> = {
    ongoing: "กำลังจัดงาน",
    draft: "ร่าง",
    published: "เผยแพร่",
    ended: "สิ้นสุดแล้ว",
    archived: "เก็บถาวร",
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Staff Dashboard</h1>
          <p className={styles.pageSubtitle}>ภาพรวมสถิติบูธและกิจกรรม</p>
        </div>
        <div className={styles.unitSelector}>
          <div className={styles.selectorInner}>
            <p className={styles.selectorLabel}>{d.exhibition_context.title}</p>
            <p className={styles.selectorTitle}>
              <span
                className={`${styles.statusDot} ${
                  d.exhibition_context.status === "ongoing"
                    ? styles.dotGreen
                    : styles.dotGray
                }`}
              />
              {d.unit_detail.name}
            </p>
          </div>
          <span className={styles.typeBadge}>
            {d.unit_detail.type === "activity" ? "กิจกรรม" : "บูธ"}
          </span>
        </div>
      </header>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <KpiCard
          title="Check-in ทั้งหมด"
          value={d.stats.total_checkins.toLocaleString()}
          icon={QrCode}
          colorKey="blue"
          subtitle="ผู้เข้าร่วมที่สแกนแล้ว"
        />
        <KpiCard
          title="รีวิวทั้งหมด"
          value={d.stats.total_reviews.toLocaleString()}
          icon={MessageSquare}
          colorKey="emerald"
        />
        <KpiCard
          title="คะแนนเฉลี่ย"
          value={`${d.stats.average_rating} / 5`}
          icon={Star}
          colorKey="amber"
        />
        <KpiCard
          title="เจ้าหน้าที่"
          value={d.staff_info.name}
          icon={Users}
          colorKey="indigo"
        />
      </div>

      {/* Feedback Radar */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <MessageSquare size={18} className={styles.iconBlue} />
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

      {/* Feedback list */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Star size={18} className={styles.iconMuted} />
          คะแนนรายหัวข้อ
        </h2>
        <ul className={styles.list}>
          {d.feedback_breakdown.map((x) => (
            <li key={x.qt_id} className={styles.item}>
              <div className={styles.itemLeft}>
                <div className={styles.topic}>{x.topic}</div>
                <div className={styles.metaRow}>{x.response_count} คน</div>
              </div>
              <div className={styles.score}>⭐ {x.score}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Unit info */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <QrCode size={18} className={styles.iconIndigo} />
          ข้อมูลบูธ / กิจกรรม
        </h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>รหัส</span>
            <span>{d.unit_detail.code}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>ประเภท</span>
            <span
              className={`${styles.typeBadge} ${
                d.unit_detail.type === "activity"
                  ? styles.typeActivity
                  : styles.typeBooth
              }`}
            >
              {d.unit_detail.type === "activity" ? "กิจกรรม" : "บูธ"}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>งาน</span>
            <span>{d.exhibition_context.title}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>สถานที่</span>
            <span>{d.exhibition_context.location}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>สถานะงาน</span>
            <span>
              {statusLabel[d.exhibition_context.status] ??
                d.exhibition_context.status}
            </span>
          </div>
        </div>
        <div className={styles.actionRow}>
          {d.unit_detail.poster_url && (
            <a
              className={styles.actionBtn}
              href={d.unit_detail.poster_url}
              target="_blank"
              rel="noreferrer"
            >
              🖼️ Poster
            </a>
          )}
          {d.unit_detail.detail_pdf_url && (
            <a
              className={styles.actionBtn}
              href={d.unit_detail.detail_pdf_url}
              target="_blank"
              rel="noreferrer"
            >
              📄 PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
