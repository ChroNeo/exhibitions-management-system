import {
  Activity,
  ArrowLeft,
  ChevronDown,
  ListFilter,
  MessageCircle,
  MessageSquare,
  QrCode,
  Star,
  Tent,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import type { OrgUnitStat } from "../../api/dashboardApi";
import styles from "./OrgDashboardPage.module.css";
import { useOrgDashboard } from "./hooks/useOrgDashboard";

// ── Gender colours (consistent palette, not from API) ─────────────────────
const GENDER_COLORS: Record<string, string> = {
  ชาย: styles.genderMale,
  male: styles.genderMale,
  หญิง: styles.genderFemale,
  female: styles.genderFemale,
};
function genderColorClass(label: string) {
  return GENDER_COLORS[label] ?? styles.genderOther;
}

// ── Sub-components ────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorKey: "blue" | "indigo" | "emerald" | "amber";
  subtitle?: string;
}
function KpiCard({ title, value, icon: Icon, colorKey, subtitle }: KpiCardProps) {
  return (
    <div className={`${styles.kpiCard} ${styles[`kpi_${colorKey}`]}`}>
      <div className={styles.kpiIcon}>
        <Icon size={28} />
      </div>
      <div className={styles.kpiText}>
        <p className={styles.kpiTitle}>{title}</p>
        <h3 className={styles.kpiValue}>{value}</h3>
        {subtitle && <p className={styles.kpiSub}>{subtitle}</p>}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  colorClass?: string;
}
function ProgressBar({ label, value, max, suffix = "", colorClass }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barClass = colorClass ?? scoreColorClass(value);
  return (
    <div className={styles.progressItem}>
      <div className={styles.progressHeader}>
        <span className={styles.progressLabel}>{label}</span>
        <span className={styles.progressValue}>
          {value}
          {suffix}
        </span>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function scoreColorClass(score: number) {
  if (score >= 4.5) return styles.fillGreen;
  if (score >= 4.0) return styles.fillAmber;
  return styles.fillRed;
}

// ── Unit drill-down view ──────────────────────────────────────────────────

interface UnitDetailProps {
  unit: OrgUnitStat;
  onBack: () => void;
}
function UnitDetail({ unit, onBack }: UnitDetailProps) {
  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={onBack} type="button">
        <ArrowLeft size={18} />
        กลับไปหน้าภาพรวมงาน
      </button>

      <header className={styles.unitHeader}>
        <div className={styles.unitMeta}>
          <span
            className={`${styles.typeBadge} ${
              unit.type === "activity" ? styles.typeActivity : styles.typeBooth
            }`}
          >
            {unit.type === "activity" ? "กิจกรรม (Activity)" : "บูธ (Booth)"}
          </span>
          <span className={styles.unitId}>Unit ID: {unit.id}</span>
        </div>
        <h1 className={styles.unitTitle}>{unit.name}</h1>
      </header>

      <div className={styles.kpiGrid}>
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
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <Activity size={18} className={styles.iconIndigo} />
            รายละเอียดคะแนนรายข้อ
          </h2>
          <div className={styles.progressList}>
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
              <p className={styles.empty}>ยังไม่มีข้อมูลคะแนน</p>
            )}
          </div>
        </div>

        {/* Recent comments */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <MessageCircle size={18} className={styles.iconPink} />
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
              <p className={styles.empty}>ยังไม่มีความคิดเห็น</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard page ───────────────────────────────────────────────────

export default function OrgDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const exhibitionId = Number(id ?? 0);
  const { data, isLoading, error } = useOrgDashboard(exhibitionId);
  const [selectedUnit, setSelectedUnit] = useState<OrgUnitStat | null>(null);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p className={styles.stateMsg}>กำลังโหลดข้อมูล...</p>
      </div>
    );
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

  const totalGender = data.demographics.gender.reduce((s, g) => s + g.value, 0);
  const maxAge = Math.max(...data.demographics.age_groups.map((a) => a.value), 1);

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
                  data.exhibition_info.status === "ongoing"
                    ? styles.dotGreen
                    : styles.dotGray
                }`}
              />
              {data.exhibition_info.title}
            </p>
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
        {/* Demographics column */}
        <div className={styles.demoColumn}>
          {/* Gender */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Users size={18} className={styles.iconMuted} />
              ข้อมูลผู้เข้าร่วมงาน (เพศ)
            </h2>
            <div className={styles.genderBar}>
              {data.demographics.gender.map((g, idx) => (
                <div
                  key={idx}
                  className={`${styles.genderSegment} ${genderColorClass(g.label)}`}
                  style={{
                    width: totalGender > 0 ? `${(g.value / totalGender) * 100}%` : "0%",
                  }}
                  title={`${g.label}: ${g.value}`}
                />
              ))}
            </div>
            <div className={styles.genderLegend}>
              {data.demographics.gender.map((g, idx) => (
                <div key={idx} className={styles.legendItem}>
                  <span
                    className={`${styles.legendDot} ${genderColorClass(g.label)}`}
                  />
                  <span>
                    {g.label} ({g.value.toLocaleString()})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Age groups */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Activity size={18} className={styles.iconMuted} />
              ช่วงอายุ (Age Groups)
            </h2>
            <div className={styles.progressList}>
              {data.demographics.age_groups.map((age, idx) => (
                <ProgressBar
                  key={idx}
                  label={age.label}
                  value={age.value}
                  max={maxAge}
                  suffix=" คน"
                  colorClass={styles.fillIndigo}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Feedback breakdown */}
        <div className={`${styles.card} ${styles.feedbackCard}`}>
          <h2 className={styles.cardTitle}>
            <MessageSquare size={18} className={styles.iconBlue} />
            เจาะลึกคะแนนประเมินภาพรวมงาน (Exhibition Feedback)
          </h2>
          <div className={styles.feedbackGrid}>
            {data.feedback_breakdown.map((item, idx) => (
              <ProgressBar
                key={idx}
                label={item.topic}
                value={item.score}
                max={5}
                suffix=" ดาว"
              />
            ))}
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

      {/* All units table */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <ListFilter size={18} className={styles.iconIndigo} />
          สถิติรายบูธและกิจกรรมทั้งหมด
        </h2>

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
              {data.all_units_stats.map((unit, idx) => (
                <tr
                  key={unit.id}
                  className={styles.clickableRow}
                  onClick={() => setSelectedUnit(unit)}
                >
                  <td className={styles.tdCenter}>{idx + 1}</td>
                  <td className={styles.unitName}>{unit.name}</td>
                  <td>
                    <span
                      className={`${styles.typeBadge} ${
                        unit.type === "activity"
                          ? styles.typeActivity
                          : styles.typeBooth
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
                        className={
                          unit.rating >= 4.5 ? styles.starFilled : styles.starEmpty
                        }
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
          {data.all_units_stats.map((unit, idx) => (
            <details key={unit.id} className={styles.mobileCard}>
              <summary className={styles.mobileCardHeader}>
                <span className={styles.mobileCardRank}>{idx + 1}</span>
                <span className={styles.mobileCardName}>{unit.name}</span>
                <span
                  className={`${styles.typeBadge} ${
                    unit.type === "activity" ? styles.typeActivity : styles.typeBooth
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
                  onClick={() => setSelectedUnit(unit)}
                >
                  ดูรายละเอียด
                </button>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
