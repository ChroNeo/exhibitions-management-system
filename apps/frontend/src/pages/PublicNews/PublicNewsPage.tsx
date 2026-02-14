import { ArrowLeft, Calendar, ChevronRight, Clock, Newspaper } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import { toFileUrl } from "../../utils/url";
import styles from "./PublicNewsPage.module.css";
import { useAllNews } from "./hooks/useAllNews";

export default function PublicNewsPage() {
  const { exhibitionId } = useParams<{ exhibitionId: string }>();
  const navigate = useNavigate();
  const exId = exhibitionId ? Number(exhibitionId) : undefined;
  const { data: newsList = [], isLoading } = useAllNews(exId);

  return (
    <div className={styles.page}>
      <HeaderBar />

      <main className={styles.main}>
        <div className={styles.header}>
          {exhibitionId && (
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate("/news")}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <Newspaper className={styles.headerIcon} />
          <h1 className={styles.title}>ข่าวสารและประกาศ</h1>
        </div>

        {isLoading ? (
          <div className={styles.loading}>กำลังโหลด...</div>
        ) : newsList.length === 0 ? (
          <div className={styles.empty}>
            <Newspaper className={styles.emptyIcon} />
            <p className={styles.emptyText}>ยังไม่มีข่าวสารในขณะนี้</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {newsList.map((news) => {
              const [datePart, timePart] = news.created_at?.split(" ") ?? [];

              return (
                <div
                  key={news.announcement_id}
                  className={styles.card}
                  onClick={() =>
                    navigate(`/news/detail/${news.announcement_id}`)
                  }
                >
                  {/* Image */}
                  <div className={styles.imageWrap}>
                    <div className={styles.imagePlaceholder} />
                    {news.image_url && (
                      <img
                        src={toFileUrl(news.image_url)}
                        alt={news.topic}
                        className={styles.image}
                      />
                    )}
                    <div className={styles.badgeWrap}>
                      <span className={styles.badge}>News</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={styles.content}>
                    {news.created_at && (
                      <div className={styles.meta}>
                        {datePart && (
                          <span className={styles.metaItem}>
                            <Calendar className={styles.metaIcon} />
                            {datePart}
                          </span>
                        )}
                        {timePart && (
                          <span className={styles.metaItem}>
                            <Clock className={styles.metaIcon} />
                            {timePart}
                          </span>
                        )}
                      </div>
                    )}

                    <h3 className={styles.cardTitle}>{news.topic}</h3>

                    {news.description && (
                      <p className={styles.cardDesc}>{news.description}</p>
                    )}

                    <div className={styles.readMore}>
                      <span>อ่านเพิ่มเติม</span>
                      <ChevronRight className={styles.readMoreIcon} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
