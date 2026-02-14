import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import liff from "@line/liff";
import { useUnitSurveyLiff } from "./hooks";
import { submitSurveyLiff } from "../../api/survey";
import { isLiffMockEnabled } from "../../hooks/useLiff";
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
          title: "Incomplete Survey",
          text: `Please answer all questions. ${unansweredCount} question(s) remaining.`,
        });
        return;
      }
    }

    setSubmitState({ status: "submitting" });

    try {
      // Submit the survey with unit_id
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

      // Show success message with SweetAlert2
      const result = await Swal.fire({
        icon: "success",
        title: "ขอบคุณสำหรับความคิดเห็นของคุณ!",
        text: "แบบสอบถามของคุณถูกส่งเรียบร้อยแล้ว",
        confirmButtonText: "กลับไปหน้าเลือกงาน",
        confirmButtonColor: "#1976d2",
      });

      if (result.isConfirmed) {
        navigate("/survey/exhibitions");
      }
    } catch (error) {
      setSubmitState({ status: "idle" });

      console.error("Survey submission error:", error);

      let errorMessage = "Failed to submit survey";

      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });

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
        <div className={styles.header}>
          <h1 className={styles.title}>Unit Survey</h1>
          <p className={styles.subtitle}>
            กรุณาประเมินความพึงพอใจของท่านต่อบูธนี้
          </p>
          <div className={styles.divider} />
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
            <p>Loading questions...</p>
          </div>
        )}

        {state.status === "error" && (
          <div className={styles.statusMessage}>
            <div className={styles.errorIcon}>🚫</div>
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
                <div className={styles.successIcon}>✅</div>
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
                        ? "Submitting..."
                        : "Submit Survey"}
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
