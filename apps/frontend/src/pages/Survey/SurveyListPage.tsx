import { useCallback, useMemo, useState } from "react";
import {
  IoArrowBack,
  IoArrowForward,
  IoBanOutline,
  IoCalendarOutline,
  IoCheckmark,
  IoDocumentTextOutline,
  IoSearchOutline,
} from "react-icons/io5";
import { useNavigate, useSearchParams } from "react-router-dom";
import { checkSurveyCompletedLiff } from "../../api/survey";
import liffClient from "../../api/liffClient";
import { getCheckedInUnits, type CheckedInUnit } from "../../api/tickets";
import { useLiff } from "../../hooks";
import styles from "./SurveyList.module.css";

type TabKey = "all" | "pending" | "completed";
interface SurveyListData {
  exhibitionId: string;
  isExhibitionSurveyCompleted: boolean;
  units: CheckedInUnit[];
}

export default function SurveyListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryExhibitionId = searchParams.get("ex_id");

  const fetchSurveyData = useCallback(async (): Promise<SurveyListData> => {
      if (queryExhibitionId && !/^\d+$/.test(queryExhibitionId)) {
        throw new Error("Exhibition ID is invalid.");
      }

      let resolvedExhibitionId = queryExhibitionId;

      if (!resolvedExhibitionId) {
        const response = await liffClient.get<{
          current_exhibition_id: number | null;
        }>("/ticket/current-exhibition");

        resolvedExhibitionId = response.data.current_exhibition_id
          ? String(response.data.current_exhibition_id)
          : null;
      }

      if (!resolvedExhibitionId) {
        throw new Error("No current exhibition available.");
      }

      const [isExhibitionSurveyCompleted, units] = await Promise.all([
        checkSurveyCompletedLiff(resolvedExhibitionId),
        getCheckedInUnits(resolvedExhibitionId),
      ]);

      return {
        exhibitionId: resolvedExhibitionId,
        isExhibitionSurveyCompleted,
        units,
      };
    }, [queryExhibitionId]);

  const surveyData = useLiff<SurveyListData>({
    liffApp: "SURVEY",
    fetchData: fetchSurveyData,
    dependencies: [queryExhibitionId],
  });

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const exhibitionId =
    surveyData.state.status === "success"
      ? surveyData.state.data.exhibitionId
      : queryExhibitionId;

  const handleUnitClick = (unitId: number) => {
    navigate(`/survey/units?ex_id=${exhibitionId}&unit_id=${unitId}`);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const list = surveyData.state.status === "success" ? surveyData.state.data.units : [];
  const isExhibitionSurveyCompleted =
    surveyData.state.status === "success"
      ? surveyData.state.data.isExhibitionSurveyCompleted
      : false;

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

  const showLoading =
    surveyData.state.status === "initializing" ||
    surveyData.state.status === "loading";

  const showLoginLoading = surveyData.state.status === "not_logged_in";

  const errorMessage =
    surveyData.state.status === "error" ? surveyData.state.message : null;

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
            <h1 className={styles.title}>Survey List</h1>
            <p className={styles.subtitle}>
              กรุณาเลือกแบบประเมินภาพรวมงานหรือบูธ/กิจกรรมที่ต้องการทำแบบสอบถาม
            </p>
            <div className={styles.divider} />
          </div>
        </div>

        {showLoading && (
          <div className={styles.statusMessage}>
            <div className={styles.spinner} />
            <p>Loading surveys...</p>
          </div>
        )}

        {showLoginLoading && (
          <div className={styles.statusMessage}>
            <div className={styles.spinner} />
            <p>Loading login...</p>
          </div>
        )}

        {errorMessage && (
          <div className={styles.statusMessage}>
            <IoBanOutline className={styles.errorIcon} />
            <h3 className={styles.errorTitle}>Error</h3>
            <p className={styles.errorMessage}>{errorMessage}</p>
            <button
              onClick={() => {
                void surveyData.refetch();
              }}
              className={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        )}

        {surveyData.state.status === "success" && (
            <>
              <section className={styles.exhibitionSection}>
                <p className={styles.sectionLabel}>Exhibition Survey</p>
                <button
                  type="button"
                  className={`${styles.exhibitionCard} ${
                    isExhibitionSurveyCompleted
                      ? styles.cardCompleted
                      : styles.cardPending
                  }`}
                  onClick={() => {
                    if (!isExhibitionSurveyCompleted) {
                      navigate(`/survey/answer?ex_id=${exhibitionId}`);
                    }
                  }}
                  disabled={isExhibitionSurveyCompleted}
                >
                  <div className={styles.unitContent}>
                    <div className={styles.unitAvatar} aria-hidden="true">
                      <IoDocumentTextOutline />
                    </div>

                    <div className={styles.unitDetails}>
                      <div className={styles.unitHeader}>
                        <h2 className={styles.unitTitle}>
                          Event Overview Survey
                        </h2>
                        {isExhibitionSurveyCompleted && (
                          <span className={styles.completedBadge}>
                            <IoCheckmark className={styles.checkIcon} />
                            ทำแล้ว
                          </span>
                        )}
                      </div>

                      <p className={styles.exhibitionDescription}>
                        ให้คะแนนภาพรวมของงานนิทรรศการและแสดงความคิดเห็นแบบไม่ระบุตัวตน
                      </p>

                      <p
                        className={`${styles.unitAction} ${
                          isExhibitionSurveyCompleted
                            ? styles.unitActionCompleted
                            : styles.unitActionPending
                        }`}
                      >
                        {isExhibitionSurveyCompleted
                          ? "แบบประเมินภาพรวมถูกส่งแล้ว"
                          : "คลิกเพื่อทำแบบประเมินภาพรวม"}
                        {!isExhibitionSurveyCompleted && (
                          <IoArrowForward className={styles.arrowIcon} />
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              </section>

              <section className={styles.unitSection}>
                <div className={styles.sectionHeading}>
                  <p className={styles.sectionLabel}>Unit Surveys</p>
                </div>

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
                            ×
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
                            isCompleted
                              ? styles.cardCompleted
                              : styles.cardPending
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
                              {isCompleted ? "✓" : "→"}
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
                                  <IoCalendarOutline
                                    className={styles.metaIcon}
                                  />{" "}
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
              </section>
            </>
          )}
      </div>
    </div>
  );
}
