import { useParams, useNavigate } from "react-router-dom";
import { useUnitDashboard } from "./hooks/useUnitDashboard";
import { KpiCard } from "./components/KpiCard";
import { FaUsers, FaStar, FaClipboardCheck } from "react-icons/fa";
import { MdRateReview } from "react-icons/md";
import styles from "./UnitDashboardPage.module.css";

export default function UnitDashboardPage() {
  const nav = useNavigate();
  const { ex_id, id } = useParams<{ ex_id: string; id: string }>();
  const exId = Number(ex_id ?? 0);
  const unitId = Number(id ?? 0);

  const { data, isLoading, error } = useUnitDashboard(exId, unitId);

  if (isLoading) return <div className={styles.page}>Loading...</div>;
  if (error || !data)
    return (
      <div className={styles.page}>
        โหลดไม่ได้: {(error as Error)?.message ?? "unknown error"}
      </div>
    );

  const d = data;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <div className={styles.brandLogo}>EX</div>
            <div>Unit Dashboard</div>
          </div>

          <div className={styles.sideSectionTitle}>UNIT</div>
          <div className={styles.nav}>
            <div className={styles.navItem}>
              <div>
                <strong>{d.unit_detail.code}</strong>
                <div>
                  <span>{d.unit_detail.type}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.sideSectionTitle}>EVENT</div>
          <div className={styles.nav}>
            <div className={styles.navItem}>
              <div>
                <strong>{d.exhibition_context.title}</strong>
                <div>
                  <span>{d.exhibition_context.location}</span>
                </div>
              </div>
            </div>
          </div>

          <button className={styles.sideBtn} onClick={() => nav(-1)}>
            ← ย้อนกลับ
          </button>
        </aside>

        {/* Main */}
        <main className={styles.main}>
          {/* Topbar */}
          <div className={styles.topbar}>
            <div className={styles.titleBlock}>
              <h1>{d.unit_detail.name}</h1>
              <div className={styles.subtitle}>
                {d.exhibition_context.title} • {d.exhibition_context.location}
              </div>
            </div>

            <div className={styles.actions}>
              <a
                className={styles.actionBtn}
                href={d.unit_detail.poster_url}
                target="_blank"
                rel="noreferrer"
              >
                🖼️ Poster
              </a>
              <a
                className={styles.actionBtn}
                href={d.unit_detail.detail_pdf_url}
                target="_blank"
                rel="noreferrer"
              >
                📄 PDF
              </a>
            </div>
          </div>

          {/* KPI */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Overview</h3>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.kpiGrid}>
                {/* ใบแรกทำให้เด่นด้วย wrapper */}
                <div
                  className={styles.heroKpi}
                  style={{ borderRadius: 18, padding: 2 }}
                >
                  <KpiCard
                    title="Check-in"
                    value={d.stats.total_checkins.toLocaleString()}
                    icon={FaClipboardCheck}
                    colorKey="blue"
                    subtitle="ผู้เข้าร่วมทั้งหมด"
                  />
                </div>

                <KpiCard
                  title="Reviews"
                  value={d.stats.total_reviews.toLocaleString()}
                  icon={MdRateReview}
                  colorKey="emerald"
                />
                <KpiCard
                  title="Avg Rating"
                  value={`${d.stats.average_rating} / 5`}
                  icon={FaStar}
                  colorKey="amber"
                />
                <KpiCard
                  title="Staff"
                  value={d.staff_info.name}
                  icon={FaUsers}
                  colorKey="indigo"
                />
              </div>
            </div>
          </section>

          {/* Breakdown */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Feedback breakdown</h3>
              <span style={{ opacity: 0.7, fontSize: 12 }}>
                {d.stats.total_reviews} รีวิว
              </span>
            </div>
            <div className={styles.cardBody}>
              <ul className={styles.list}>
                {d.feedback_breakdown.map((x) => (
                  <li key={x.qt_id} className={styles.item}>
                    <div className={styles.itemLeft}>
                      <div className={styles.topic}>{x.topic}</div>
                      <div className={styles.metaRow}>
                        {x.response_count} คนตอบ
                      </div>
                    </div>
                    <div className={styles.score}>⭐ {x.score}</div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
