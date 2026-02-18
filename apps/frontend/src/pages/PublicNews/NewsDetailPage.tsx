import { ArrowLeft, Calendar, Newspaper } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import { toFileUrl } from "../../utils/url";
import styles from "./NewsDetailPage.module.css";
import { useAllNews } from "./hooks/useAllNews";

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: newsList = [], isLoading } = useAllNews();

  const news = newsList.find((n) => n.announcement_id === Number(id));

  return (
    <div className={styles.page}>
      <HeaderBar />

      <main className={styles.main}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          กลับ
        </button>

        {isLoading ? (
          <div className={styles.loading}>กำลังโหลด...</div>
        ) : !news ? (
          <div className={styles.notFound}>
            <Newspaper className={styles.notFoundIcon} />
            <p className={styles.notFoundText}>ไม่พบข่าวสารนี้</p>
          </div>
        ) : (
          <article className={styles.article}>
            {news.image_url && (
              <div className={styles.imageWrap}>
                <img
                  src={toFileUrl(news.image_url)}
                  alt={news.topic}
                  className={styles.image}
                />
              </div>
            )}

            <div className={styles.body}>
              <div className={styles.meta}>
                <span className={styles.tag}>News</span>
                {news.created_at && (
                  <span className={styles.date}>
                    <Calendar className={styles.dateIcon} />
                    {news.created_at}
                  </span>
                )}
              </div>

              <h1 className={styles.title}>{news.topic}</h1>

              {news.description && (
                <p className={styles.description}>{news.description}</p>
              )}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
