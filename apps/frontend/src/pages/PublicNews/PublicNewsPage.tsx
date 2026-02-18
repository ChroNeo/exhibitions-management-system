import { Calendar, ChevronRight, Clock, Newspaper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import { toFileUrl } from "../../utils/url";
import styles from "./PublicNewsPage.module.css";
import { useAllNewsLiff } from "./hooks/useAllNews";

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
          <div className={styles.loading}>กำลังโหลด...</div>
        ) : state.status === "not_logged_in" ? (
          <div className={styles.loading}>กำลังเข้าสู่ระบบ LINE...</div>
        ) : state.status === "error" ? (
          <div className={styles.empty}>
            <Newspaper className={styles.emptyIcon} />
            <p className={styles.emptyText}>{state.message}</p>
            <button type="button" onClick={refetch}>ลองใหม่</button>
          </div>
        ) : state.data.length === 0 ? (
          <div className={styles.empty}>
            <Newspaper className={styles.emptyIcon} />
            <p className={styles.emptyText}>ยังไม่มีข่าวสารในขณะนี้</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {state.data.map((news) => {
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
