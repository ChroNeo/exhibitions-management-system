import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExhibitionSurveyList } from "./hooks";
import { toFileUrl } from "../../utils/url";
import {
  IoLocationOutline,
  IoCalendarOutline,
  IoSearchOutline,
  IoCheckmark,
  IoArrowForward,
  IoBanOutline,
} from "react-icons/io5";
import styles from "./SurveySelect.module.css";

type TabKey = "all" | "pending" | "completed";

export default function SurveySelectPage() {
  const navigate = useNavigate();
  const { state, refetch } = useExhibitionSurveyList();

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");

  const handleExhibitionClick = (exhibitionId: number) => {
    navigate(`/survey/answer?ex_id=${exhibitionId}`);
  };

  const list = state.status === "success" ? state.data : [];

  const counts = useMemo(() => {
    const completed = list.filter((x) => x.survey_completed === 1).length;
    const pending = list.length - completed;
    return { total: list.length, pending, completed };
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return list
      .filter((x) => {
        if (tab === "pending") return x.survey_completed !== 1;
        if (tab === "completed") return x.survey_completed === 1;
        return true;
      })
      .filter((x) => {
        if (!q) return true;
        const title = (x.title ?? "").toLowerCase();
        const location = (x.location ?? "").toLowerCase();
        return title.includes(q) || location.includes(q);
      });
  }, [list, tab, query]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Select Exhibition for Survey</h1>
          <p className={styles.subtitle}>กรุณาเลือกงานที่ต้องการทำแบบสอบถาม</p>
          <div className={styles.divider} />
        </div>

        {/* Loading / Error */}
        {state.status === "initializing" && (
          <div className={styles.statusMessage}>
            <div className={styles.spinner} />
            <p>Loading...</p>
          </div>
        )}

        {state.status === "not_logged_in" && (
          <div className={styles.statusMessage}>
            <div className={styles.spinner} />
            <p>Loading login...</p>
          </div>
        )}

        {state.status === "loading" && (
          <div className={styles.statusMessage}>
            <div className={styles.spinner} />
            <p>Loading your exhibitions...</p>
          </div>
        )}

        {state.status === "error" && (
          <div className={styles.statusMessage}>
            <IoBanOutline className={styles.errorIcon} />
            <h3 className={styles.errorTitle}>Error</h3>
            <p className={styles.errorMessage}>{state.message}</p>
            <button onClick={refetch} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        )}

        {state.status === "success" && (
          <>
            {list.length > 0 && (
              <div className={styles.controls}>
                <div className={styles.tabs}>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${
                      tab === "all" ? styles.tabBtnActive : ""
                    }`}
                    onClick={() => setTab("all")}
                  >
                    ทั้งหมด ({counts.total})
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${
                      tab === "pending" ? styles.tabBtnActive : ""
                    }`}
                    onClick={() => setTab("pending")}
                  >
                    ยังไม่ทำ ({counts.pending})
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${
                      tab === "completed" ? styles.tabBtnActive : ""
                    }`}
                    onClick={() => setTab("completed")}
                  >
                    ทำแล้ว ({counts.completed})
                  </button>
                </div>

                <div className={styles.searchWrap}>
                  <div className={styles.searchBox}>
                    <span className={styles.searchIconWrap}>
                      <IoSearchOutline className={styles.searchIcon} />
                    </span>
                    <input
                      className={styles.searchInput}
                      placeholder="ค้นหาชื่องาน / สถานที่..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button
                        type="button"
                        className={styles.clearBtn}
                        onClick={() => setQuery("")}
                        aria-label="ล้างข้อความค้นหา"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <span className={styles.countHint}>
                    แสดง {filtered.length} รายการ
                  </span>
                </div>
              </div>
            )}

            {filtered.length > 0 ? (
              <div className={styles.exhibitionList}>
                {filtered.map((exhibition) => {
                  const isCompleted = exhibition.survey_completed === 1;

                  return (
                    <div
                      key={exhibition.exhibition_id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        handleExhibitionClick(exhibition.exhibition_id)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleExhibitionClick(exhibition.exhibition_id);
                        }
                      }}
                      className={`${styles.exhibitionCard} ${
                        isCompleted ? styles.cardCompleted : styles.cardPending
                      }`}
                    >
                      <div
                        className={`${styles.statusStripe} ${
                          isCompleted ? styles.statusStripeCompleted : ""
                        }`}
                        aria-hidden="true"
                      />

                      <div className={styles.exhibitionContent}>
                        {exhibition.picture_path ? (
                          <img
                            src={toFileUrl(exhibition.picture_path)}
                            alt={exhibition.title}
                            className={styles.exhibitionImage}
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className={styles.exhibitionImage}
                            aria-hidden="true"
                          />
                        )}

                        <div className={styles.exhibitionDetails}>
                          <div className={styles.exhibitionHeader}>
                            <h3 className={styles.exhibitionTitle}>
                              {exhibition.title}
                            </h3>
                            {isCompleted && (
                              <span className={styles.completedBadge}>
                                <IoCheckmark className={styles.checkIcon} />
                                ทำแล้ว
                              </span>
                            )}
                          </div>

                          <div className={styles.metaRow}>
                            {exhibition.location && (
                              <p className={styles.exhibitionLocation}>
                                <IoLocationOutline
                                  className={styles.metaIcon}
                                />{" "}
                                {exhibition.location}
                              </p>
                            )}
                            <p className={styles.exhibitionDate}>
                              <IoCalendarOutline className={styles.metaIcon} />{" "}
                              {new Date(
                                exhibition.start_date,
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(
                                exhibition.end_date,
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          <p
                            className={`${styles.exhibitionAction} ${
                              isCompleted
                                ? styles.exhibitionActionCompleted
                                : styles.exhibitionActionPending
                            }`}
                          >
                            {isCompleted
                              ? "คลิกเพื่อดูรายละเอียด"
                              : "คลิกเพื่อทำแบบสอบถาม"}
                            <IoArrowForward className={styles.arrowIcon} />
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyMessage}>
                <div className={styles.emptyIcon}>🗂️</div>
                <h3 className={styles.emptyTitle}>ไม่พบรายการ</h3>
                <button
                  type="button"
                  className={styles.emptyButton}
                  onClick={() => {
                    setTab("all");
                    setQuery("");
                  }}
                >
                  รีเซ็ตตัวกรอง
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
