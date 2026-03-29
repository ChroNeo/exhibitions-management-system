import DOMPurify from "dompurify";
import { Bell, Clock, Newspaper, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import type { UnitApi } from "../../types/units";
import { extractPlainTextDescription } from "../../utils/text";
import { toFileUrl } from "../../utils/url";
import { useAllNewsLiff } from "./hooks/useAllNews";
import styles from "./PublicNewsPage.module.css";
import { PublicNewsPageSkeleton } from "./PublicNewsPageSkeleton";

function getMinutesUntil(startsAt: string | undefined): number {
  if (!startsAt) return 0;
  const start = new Date(startsAt.replace(" ", "T"));
  return Math.max(1, Math.ceil((start.getTime() - Date.now()) / 60000));
}

function formatStartTime(startsAt: string | undefined): string {
  if (!startsAt) return "-";
  const timePart = startsAt.split(" ")[1] ?? "";
  return timePart.slice(0, 5);
}

function sanitizeTextContent(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

function UpcomingUnitCard({
  unit,
  onClick,
}: {
  unit: UnitApi;
  onClick: () => void;
}) {
  const minutesLeft = getMinutesUntil(unit.starts_at);
  const descriptionText = sanitizeTextContent(
    extractPlainTextDescription({
      html: unit.description ?? undefined,
      delta: unit.description_delta ?? undefined,
    }),
  );
  const staffNames = Array.isArray(unit.staff_names)
    ? unit.staff_names.filter(Boolean)
    : [];

  return (
    <div className={styles.upcomingCard} onClick={onClick}>
      <div className={styles.upcomingCardHeader}>
        <span className={styles.urgentBadge}>
          <Bell size={11} />
          เริ่มใน {minutesLeft} นาที
        </span>
        <span className={styles.typeBadge}>
          {unit.unit_type === "booth" ? "บูธ" : "กิจกรรม"}
        </span>
      </div>

      <h3 className={styles.upcomingUnitName}>{unit.unit_name}</h3>

      {descriptionText && (
        <p className={styles.upcomingDesc}>{descriptionText}</p>
      )}

      <div className={styles.upcomingMeta}>
        <Clock size={13} />
        <span>เริ่ม {formatStartTime(unit.starts_at)} น.</span>
        {staffNames.length > 0 && (
          <>
            <Users size={13} className={styles.upcomingMetaSep} />
            <span>{staffNames.slice(0, 2).join(", ")}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function PublicNewsPage() {
  const navigate = useNavigate();
  const { state, refetch } = useAllNewsLiff();

  return (
    <div className={styles.page}>
      <HeaderBar />

      <main className={styles.main}>
        <div className={styles.header}>
          <Newspaper className={styles.headerIcon} />
          <h1 className={styles.title}>ข่าวสารและประกาศ</h1>
        </div>

        {state.status === "initializing" || state.status === "loading" ? (
          <PublicNewsPageSkeleton />
        ) : state.status === "not_logged_in" ? (
          <PublicNewsPageSkeleton />
        ) : state.status === "error" ? (
          <div className={styles.empty}>
            <Newspaper className={styles.emptyIcon} />
            <p className={styles.emptyText}>{state.message}</p>
            <button type="button" onClick={refetch}>
              ลองใหม่
            </button>
          </div>
        ) : state.data.news.length === 0 &&
          state.data.upcomingUnits.length === 0 ? (
          <div className={styles.empty}>
            <Newspaper className={styles.emptyIcon} />
            <p className={styles.emptyText}>ยังไม่มีข่าวสารในขณะนี้</p>
          </div>
        ) : (
          <>
            {state.data.upcomingUnits.length > 0 && (
              <section className={styles.upcomingSection}>
                <div className={styles.upcomingHeader}>
                  <Bell className={styles.upcomingIcon} />
                  <h2 className={styles.upcomingTitle}>
                    กำลังจะเริ่มเร็วๆ นี้
                  </h2>
                  <span className={styles.upcomingCount}>
                    {state.data.upcomingUnits.length} รายการ
                  </span>
                </div>
                <div className={styles.upcomingGrid}>
                  {state.data.upcomingUnits.map((unit) => (
                    <UpcomingUnitCard
                      key={unit.unit_id}
                      unit={unit}
                      onClick={() =>
                        navigate(
                          `/exhibitions/${unit.exhibition_id}/unit/${unit.unit_id}`,
                        )
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {state.data.news.length > 0 && (
              <div className={styles.grid}>
                {state.data.news.map((news) => {
                  const [datePart] = news.created_at?.split(" ") ?? [];
                  const newsDescription = news.description
                    ? sanitizeTextContent(news.description)
                    : "";

                  return (
                    <div
                      key={news.announcement_id}
                      className={styles.newsCard}
                      onClick={() =>
                        navigate(`/news/detail/${news.announcement_id}`)
                      }
                    >
                      <div className={styles.newsImageWrap}>
                        {news.image_url && (
                          <img
                            src={toFileUrl(news.image_url)}
                            alt={news.topic}
                            className={styles.newsImage}
                          />
                        )}
                      </div>

                      <div className={styles.newsContent}>
                        <div className={styles.newsMeta}>
                          <span className={styles.newsTag}>ประกาศ</span>
                          {datePart && (
                            <span className={styles.newsDate}>{datePart}</span>
                          )}
                        </div>

                        <h3 className={styles.newsTitle}>{news.topic}</h3>

                        {newsDescription && (
                          <p className={styles.newsDesc}>{newsDescription}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
