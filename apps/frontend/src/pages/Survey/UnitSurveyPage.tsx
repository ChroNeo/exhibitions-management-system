import liff from "@line/liff";
import axios from "axios";
import { useState } from "react";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { submitSurveyLiff } from "../../api/survey";
import { isLiffMockEnabled } from "../../hooks/useLiff";
import { useUnitSurveyLiff } from "./hooks";
import styles from "./UnitSurvey.module.css";

interface SurveyAnswer {
  qt_id: number;
  rating: number;
}

type SubmitState = { status: "idle" } | { status: "submitting" };

export default function UnitSurveyPage() {
  const navigate = useNavigate();

  // Get exhibition_id and unit_id from URL query string
  const params = new URLSearchParams(window.location.search);
  const exhibitionId = params.get("ex_id");
  const unitId = params.get("unit_id");

  const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
  const [comment, setComment] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  });

  // Use the custom LIFF hook for unit surveys
  const { state, refetch } = useUnitSurveyLiff({
    exhibitionId,
    unitId,
  });

  const handleRatingChange = (questionId: number, rating: number) => {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.qt_id === questionId);
      if (existing) {
        return prev.map((a) => (a.qt_id === questionId ? { ...a, rating } : a));
      }
      return [...prev, { qt_id: questionId, rating }];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!exhibitionId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Exhibition ID is missing",
      });
      return;
    }

    if (!unitId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Unit ID is missing",
      });
      return;
    }

    // Validate that all questions are answered
    if (state.status === "success") {
      const unansweredCount = state.data.questions.length - answers.length;
      if (unansweredCount > 0) {
        Swal.fire({
          icon: "warning",
          title: "คุณยังตอบแบบสอบถามไม่ครบถ้วน",
          text: `กรุณาตอบคำถามให้ครบทุกข้อ (ยังเหลือ 4 ข้อ)`,
        });
        return;
      }
    }

    setSubmitState({ status: "submitting" });

    try {
      await submitSurveyLiff({
        exhibition_id: Number(exhibitionId),
        unit_id: Number(unitId),
        comment: comment || undefined,
        answers: answers.map((a) => ({
          qt_id: a.qt_id,
          score: a.rating,
        })),
      });

      setSubmitState({ status: "idle" });

      const result = await Swal.fire({
        icon: "success",
        title: "ขอบคุณสำหรับความคิดเห็นของคุณ!",
        text: "แบบสอบถามของคุณถูกส่งเรียบร้อยล้ว",
        confirmButtonText: "กลับไปหน้าเลือกงาน",
        confirmButtonColor: "#1976d2",
      });

      if (result.isConfirmed) {
        navigate(`/survey/list?ex_id=${exhibitionId}`);
      }
    } catch (error) {
      setSubmitState({ status: "idle" });

      let errorMessage = "Failed to submit survey";

      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status) {
          errorMessage = `Server error (${error.response.status})`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: errorMessage,
      });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div className={styles.header}>
            <h1 className={styles.title}>แบบประเมินความพึงพอใจบูธกิจกรรม</h1>
            <p className={styles.subtitle}>
              กรุณาประเมินความพึงพอใจของท่านต่อบูธนี้
            </p>
            <div className={styles.divider} />
          </div>
        </div>

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
            <p>กำลังโหลดคำถาม...</p>
          </div>
        )}

        {state.status === "error" && (
          <div className={styles.statusMessage}>
            <div className={styles.errorIcon}>
              <IoCloseCircle />
            </div>
            <h3 className={styles.errorTitle}>Error</h3>
            <p className={styles.errorMessage}>{state.message}</p>
            <button onClick={refetch} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        )}

        {state.status === "success" && (
          <>
            {state.data.isCompleted ? (
              <div className={styles.successMessage}>
                <div className={styles.successIcon}>
                  <IoCheckmarkCircle />
                </div>
                <h2 className={styles.successTitle}>
                  ขอบคุณสำหรับความคิดเห็นของคุณ!
                </h2>
                <p className={styles.successDescription}>
                  คุณได้ทำแบบสอบถามนี้เรียบร้อยแล้ว
                </p>

                <button
                  onClick={() => {
                    if (isLiffMockEnabled()) window.close();
                    else liff.closeWindow();
                  }}
                  className={styles.primaryButton}
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                {state.data.questions && state.data.questions.length > 0 ? (
                  <div className={styles.questionList}>
                    {state.data.questions.map((question, index) => (
                      <div key={question.qt_id} className={styles.questionCard}>
                        <h3 className={styles.questionTitle}>
                          {index + 1}. {question.content}
                        </h3>

                        <div className={styles.ratingRow}>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <label key={rating} className={styles.ratingChip}>
                              <input
                                type="radio"
                                name={`question-${question.qt_id}`}
                                value={rating}
                                onChange={() =>
                                  handleRatingChange(question.qt_id, rating)
                                }
                                className={styles.ratingInput}
                              />
                              <span className={styles.ratingValue}>
                                {rating}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className={styles.commentCard}>
                      <h3 className={styles.commentTitle}>
                        ข้อเสนอแนะเพิ่มเติม
                      </h3>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="กรุณากรอกข้อเสนอแนะของท่าน..."
                        className={styles.commentTextarea}
                      />
                    </div>

                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={submitState.status === "submitting"}
                    >
                      {submitState.status === "submitting"
                        ? "กำลังส่งแบบสอบถาม..."
                        : "ยืนยัน"}
                    </button>
                  </div>
                ) : (
                  <div className={styles.emptyMessage}>
                    <div className={styles.emptyIcon}>🗂️</div>
                    <h3 className={styles.emptyTitle}>ไม่พบคำถาม</h3>
                    <button
                      type="button"
                      className={styles.retryButton}
                      onClick={refetch}
                    >
                      โหลดใหม่
                    </button>
                  </div>
                )}
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
