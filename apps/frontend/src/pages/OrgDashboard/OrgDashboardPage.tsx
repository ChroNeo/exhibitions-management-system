import DOMPurify from "dompurify";
import { Activity, ChevronDown, ListFilter, MessageSquare, QrCode, Star, Tent, Users } from "lucide-react";
import { useState } from "react";
import { Bar, Doughnut, Radar } from "react-chartjs-2";
import { useParams } from "react-router-dom";
import type { OrgUnitStat } from "../../api/dashboardApi";
import "./ChartSetup";
import styles from "./OrgDashboardPage.module.css";
import { KpiCard } from "./components/KpiCard";
import { OrgDashboardSkeleton } from "./components/OrgDashboardSkeleton";
import { UnitDetail } from "./components/UnitDetail";
import { UnitsTable } from "./components/UnitsTable";
import { useOrgDashboard } from "./hooks/useOrgDashboard";

export default function OrgDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const exhibitionId = Number(id ?? 0);
  const { data, isLoading, error } = useOrgDashboard(exhibitionId);
  const [selectedUnit, setSelectedUnit] = useState<OrgUnitStat | null>(null);

  if (isLoading) {
    return <OrgDashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <p className={styles.stateMsg}>
          ไม่สามารถโหลดข้อมูลได้: {(error as Error)?.message ?? "unknown error"}
        </p>
      </div>
    );
  }

  if (selectedUnit) {
    return <UnitDetail unit={selectedUnit} onBack={() => setSelectedUnit(null)} />;
  }

  // ── Chart data ──────────────────────────────────────────────────────────

  const GENDER_PALETTE = ["#3b82f6", "#f472b6", "#94a3b8", "#a78bfa"];

  const genderChartData = {
    labels: data.demographics.gender.map((g) => g.label),
    datasets: [
      {
        data: data.demographics.gender.map((g) => g.value),
        backgroundColor: GENDER_PALETTE.slice(0, data.demographics.gender.length),
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const ageChartData = {
    labels: data.demographics.age_groups.map((a) => a.label),
    datasets: [
      {
        label: "จำนวน (คน)",
        data: data.demographics.age_groups.map((a) => a.value),
        backgroundColor: "#6366f1cc",
        borderColor: "#6366f1",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const radarChartData = {
    labels: data.feedback_breakdown.map((f) => f.topic),
    datasets: [
      {
        label: "คะแนนเฉลี่ย",
        data: data.feedback_breakdown.map((f) => f.score),
        backgroundColor: "#3b82f622",
        borderColor: "#3b82f6",
        pointBackgroundColor: "#3b82f6",
        borderWidth: 2,
      },
    ],
  };

  const unitsBarData = {
    labels: data.all_units_stats.map((u) => u.name),
    datasets: [
      {
        label: "Check-in (ครั้ง)",
        data: data.all_units_stats.map((u) => u.checkins),
        backgroundColor: "#10b981cc",
        borderColor: "#10b981",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = (label: string) => ({
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { x: number | null } }) =>
            ` ${(ctx.parsed.x ?? 0).toLocaleString()} ${label}`,
        },
      },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: "#e2e8f020" } },
      y: { ticks: { font: { size: 12 } } },
    },
  });

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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const, labels: { padding: 16, font: { size: 13 } } },
    },
  };

  const unitsBarHeight = Math.max(200, data.all_units_stats.length * 36);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Organizer Dashboard</h1>
          <p className={styles.pageSubtitle}>ภาพรวมสถิติการจัดงานนิทรรศการ</p>
        </div>
        <div className={styles.exhibitionSelector}>
          <div className={styles.selectorInner}>
            <p className={styles.selectorLabel}>นิทรรศการปัจจุบัน</p>
            <p className={styles.selectorTitle}>
              <span
                className={`${styles.statusDot} ${
                  data.exhibition_info.status === "ongoing" ? styles.dotGreen : styles.dotGray
                }`}
              />
              {data.exhibition_info.title}
            </p>
            {data.exhibition_info.description && (
              <p
                className={styles.selectorDesc}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.exhibition_info.description) }}
              />
            )}
          </div>
          <ChevronDown size={18} className={styles.chevronIcon} />
        </div>
      </header>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <KpiCard
          title="ยอดลงทะเบียนล่วงหน้า"
          value={data.kpis.total_registrations.toLocaleString()}
          icon={Users}
          colorKey="blue"
          subtitle="จากตาราง registrations"
        />
        <KpiCard
          title="จำนวนบูธ / กิจกรรม"
          value={data.kpis.total_units}
          icon={Tent}
          colorKey="indigo"
          subtitle="จากตาราง units"
        />
        <KpiCard
          title="ยอดสแกน Check-in รวม"
          value={data.kpis.total_checkins.toLocaleString()}
          icon={QrCode}
          colorKey="emerald"
        />
        <KpiCard
          title="คะแนนพึงพอใจภาพรวม"
          value={
            data.kpis.exhibition_avg_score !== null
              ? `${data.kpis.exhibition_avg_score} / 5`
              : "N/A"
          }
          icon={Star}
          colorKey="amber"
        />
      </div>

      {/* Demographics + Feedback */}
      <div className={styles.midGrid}>
        <div className={styles.demoColumn}>
          {/* Gender – Doughnut */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Users size={18} className={styles.iconMuted} />
              ข้อมูลผู้เข้าร่วมงาน (เพศ)
            </h2>
            <div className={styles.chartWrapper}>
              <Doughnut data={genderChartData} options={doughnutOptions} />
            </div>
          </div>

          {/* Age groups – horizontal Bar */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Activity size={18} className={styles.iconMuted} />
              ช่วงอายุ (Age Groups)
            </h2>
            <div className={styles.chartWrapper}>
              <Bar data={ageChartData} options={barChartOptions("คน")} />
            </div>
          </div>
        </div>

        {/* Feedback – Radar */}
        <div className={`${styles.card} ${styles.feedbackCard}`}>
          <h2 className={styles.cardTitle}>
            <MessageSquare size={18} className={styles.iconBlue} />
            เจาะลึกคะแนนประเมินภาพรวมงาน (Exhibition Feedback)
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
      </div>

      {/* Exhibition-level recent comments */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <MessageSquare size={18} className={styles.iconBlue} />
          ความคิดเห็นภาพรวมงาน (Exhibition Comments)
        </h2>
        {data.recent_comments.length === 0 ? (
          <p className={styles.empty}>ยังไม่มีความคิดเห็น</p>
        ) : (
          <ul className={styles.commentList}>
            {data.recent_comments.map((c, i) => (
              <li key={i} className={styles.commentItem}>
                <span className={styles.commentDot} />
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Check-ins per unit – horizontal Bar */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <QrCode size={18} className={styles.iconIndigo} />
          ยอด Check-in รายบูธและกิจกรรม
        </h2>
        <div style={{ height: unitsBarHeight }}>
          <Bar data={unitsBarData} options={barChartOptions("ครั้ง")} />
        </div>
      </div>

      {/* All units table */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <ListFilter size={18} className={styles.iconIndigo} />
          สถิติรายบูธและกิจกรรมทั้งหมด
        </h2>
        <UnitsTable units={data.all_units_stats} onSelectUnit={setSelectedUnit} />
      </div>
    </div>
  );
}
