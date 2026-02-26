import { ArrowLeft, Calendar, Newspaper } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import { toFileUrl } from "../../utils/url";
import { toDeltaObject } from "../../utils/quillDelta";
import styles from "./NewsDetailPage.module.css";
import { useAllNews } from "./hooks/useAllNews";
import Quill from "quill";

function QuillViewer({ delta }: { delta: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Create a fresh mount target each time
    const mountEl = document.createElement("div");
    wrapper.innerHTML = "";
    wrapper.appendChild(mountEl);

    const quill = new Quill(mountEl, {
      theme: "snow",
      readOnly: true,
      modules: { toolbar: false },
    });
    quill.setContents(
      toDeltaObject(delta) as Parameters<typeof quill.setContents>[0],
      "silent",
    );

    return () => {
      wrapper.innerHTML = "";
    };
  }, [delta]);

  return <div ref={wrapperRef} className={styles.quillViewer} />;
}

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

              {news.description_delta ? (
                <QuillViewer delta={news.description_delta} />
              ) : news.description ? (
                <p className={styles.description}>{news.description}</p>
              ) : null}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
