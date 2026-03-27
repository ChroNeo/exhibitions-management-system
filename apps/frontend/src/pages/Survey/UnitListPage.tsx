import { useMemo, useState } from "react";
import {
  IoArrowBack,
  IoArrowForward,
  IoBanOutline,
  IoCalendarOutline,
  IoCheckmark,
  IoSearchOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useUnitList } from "./hooks";
import styles from "./UnitList.module.css";

type TabKey = "all" | "pending" | "completed";

export default function UnitListPage() {
  const navigate = useNavigate();

  // Get exhibition_id from URL
  const params = new URLSearchParams(window.location.search);
  const exhibitionId = params.get("ex_id");

  const { state, refetch } = useUnitList({ exhibitionId });

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");

  const handleUnitClick = (unitId: number) => {
    navigate(`/survey/units?ex_id=${exhibitionId}&unit_id=${unitId}`);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const list = state.status === "success" ? state.data : [];

  const counts = useMemo(() => {
    const completed = list.filter((x) => !!x.survey_completed).length;
    const pending = list.length - completed;
    return { total: list.length, pending, completed };
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return list
      .filter((x) => {
        if (tab === "pending") return !x.survey_completed;
        if (tab === "completed") return !!x.survey_completed;
        return true;
      })
      .filter((x) => {
        if (!q) return true;
        const name = (x.unit_name ?? "").toLowerCase();
        return name.includes(q);
      });
  }, [list, tab, query]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={handleBackClick}
            aria-label="ย้อนกลับ"
          >
            <IoArrowBack />
          </button>

          <div className={styles.header}>
            <h1 className={styles.title}>Select Unit / Activity</h1>
            <p className={styles.subtitle}>
              กรุณาเลือกบูธ/กิจกรรมที่ต้องการทำแบบสอบถาม
            </p>
            <div className={styles.divider} />
          </div>
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
            <p>Loading units...</p>
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
                      placeholder="ค้นหาชื่อบูธ/กิจกรรม..."
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
              <div className={styles.unitList}>
                {filtered.map((unit) => {
                  const isCompleted = !!unit.survey_completed;

                  return (
                    <div
                      key={unit.unit_id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleUnitClick(unit.unit_id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleUnitClick(unit.unit_id);
                        }
                      }}
                      className={`${styles.unitCard} ${
                        isCompleted ? styles.cardCompleted : styles.cardPending
                      }`}
                    >
                      <div
                        className={`${styles.statusStripe} ${
                          isCompleted ? styles.statusStripeCompleted : ""
                        }`}
                        aria-hidden="true"
                      />

                      <div className={styles.unitContent}>
                        <div className={styles.unitAvatar} aria-hidden="true">
                          {isCompleted ? "✓" : "•"}
                        </div>

                        <div className={styles.unitDetails}>
                          <div className={styles.unitHeader}>
                            <h3 className={styles.unitTitle}>
                              {unit.unit_name}
                            </h3>

                            {isCompleted && (
                              <span className={styles.completedBadge}>
                                <IoCheckmark className={styles.checkIcon} />
                                ทำแล้ว
                              </span>
                            )}
                          </div>

                          <div className={styles.metaRow}>
                            <p className={styles.unitDate}>
                              <IoCalendarOutline className={styles.metaIcon} />{" "}
                              เข้าชมเมื่อ:{" "}
                              {new Date(unit.checkin_at).toLocaleString(
                                "th-TH",
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                },
                              )}
                              น.
                            </p>
                          </div>

                          <p
                            className={`${styles.unitAction} ${
                              isCompleted
                                ? styles.unitActionCompleted
                                : styles.unitActionPending
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
