import { LayoutDashboard, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import { useExhibitions } from "../../hooks";
import type { Exhibition } from "../../types/exhibition";
import styles from "./DashboardSelectorPage.module.css";

export default function DashboardSelectorPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useExhibitions();
  const items: Exhibition[] = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((ex) => {
      const q = search.toLowerCase();
      return (
        !q ||
        ex.title.toLowerCase().includes(q) ||
        (ex.location ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const handleSelectExhibition = (id: string) => {
    navigate(`/dashboard/organizer/${id}`);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      ongoing: { label: "กำลังจัด", className: styles.statusOngoing },
      published: { label: "เผยแพร่", className: styles.statusPublished },
      ended: { label: "จบงาน", className: styles.statusEnded },
      draft: { label: "ร่าง", className: styles.statusDraft },
      archived: { label: "เก็บ", className: styles.statusArchived },
    };
    const config = statusMap[status] || { label: status, className: styles.statusDefault };
    return <span className={`${styles.statusBadge} ${config.className}`}>{config.label}</span>;
  };

  return (
    <div className={styles.page}>
      <HeaderBar active="dashboard" onLoginClick={() => navigate("/login")} />

      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <LayoutDashboard size={32} className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>เลือกนิทรรศการ</h1>
              <p className={styles.pageSubtitle}>
                เลือกนิทรรศการเพื่อดู Dashboard และสถิติ
              </p>
            </div>
          </div>
        </div>

        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="ค้นหานิทรรศการ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading && (
          <div className={styles.loading}>กำลังโหลดรายการนิทรรศการ...</div>
        )}

        {isError && (
          <div className={styles.error}>ไม่สามารถโหลดข้อมูลได้</div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className={styles.empty}>
            {search ? "ไม่พบนิทรรศการที่ค้นหา" : "ยังไม่มีนิทรรศการ"}
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className={styles.grid}>
            {filtered.map((exhibition) => (
              <div
                key={exhibition.id}
                className={styles.card}
                onClick={() => handleSelectExhibition(exhibition.id)}
              >
                {exhibition.coverUrl && (
                  <div className={styles.cardImage}>
                    <img src={exhibition.coverUrl} alt={exhibition.title} />
                  </div>
                )}
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{exhibition.title}</h3>
                    {getStatusBadge(exhibition.status)}
                  </div>
                  {exhibition.location && (
                    <p className={styles.cardLocation}>{exhibition.location}</p>
                  )}
                  {exhibition.dateText && (
                    <p className={styles.cardDate}>{exhibition.dateText}</p>
                  )}
                  {exhibition.description && (
                    <p className={styles.cardDescription}>
                      {exhibition.description}
                    </p>
                  )}
                </div>
                <div className={styles.cardFooter}>
                  <button
                    type="button"
                    className={styles.viewButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectExhibition(exhibition.id);
                    }}
                  >
                    <LayoutDashboard size={16} />
                    ดู Dashboard
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
