import axios from "axios";
import { useState } from "react";
import { IoCloseCircle } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { submitSurveyLiff } from "../../../api/survey";
import styles from "../ExhibitionSurvey.module.css";
import { useSurveyLiff } from "../hooks";

interface SurveyAnswer {
  qt_id: number;
  rating: number;
}

type SubmitState = { status: "idle" } | { status: "submitting" };

interface ExhibitionSurveyContentProps {
  exhibitionId: string;
}

export function ExhibitionSurveyContent({
  exhibitionId,
}: ExhibitionSurveyContentProps) {
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
  const [comment, setComment] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  });

  // Use the custom LIFF hook
  const { state, refetch } = useSurveyLiff({
    exhibitionId,
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

    // Validate that all questions are answered
    if (state.status === "success") {
      const unansweredCount = state.data.length - answers.length;
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
      // Submit the survey
      await submitSurveyLiff({
        exhibition_id: Number(exhibitionId),
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
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <h1 className={styles.title}>Exhibition Survey</h1>
            <p className={styles.subtitle}>กรุณาประเมินความพึงพอใจของท่าน</p>
          </div>
        </header>

        <div className={styles.divider} />

        {state.status === "initializing" && (
          <div className={styles.statusCard}>
            <div className={styles.spinner} />
            <p>Loading...</p>
          </div>
        )}

        {state.status === "not_logged_in" && (
          <div className={styles.statusCard}>
            <p>Loading login...</p>
          </div>
        )}

        {state.status === "loading" && (
          <div className={styles.statusCard}>
            <div className={styles.spinner} />
            <p>Loading questions...</p>
          </div>
        )}

        {state.status === "error" && (
          <div className={styles.statusCard}>
            <div className={styles.iconWrapperError}>
              <IoCloseCircle className={styles.iconError} />
            </div>

            <h3>Error</h3>
            <p className={styles.errorMessage}>{state.message}</p>
            <button onClick={refetch} className={styles.primaryBtn}>
              Try Again
            </button>
          </div>
        )}

        {state.status === "success" && (
          <div className={styles.card}>
            <form onSubmit={handleSubmit} className={styles.form}>
              {state.data && state.data.length > 0 ? (
                <>
                  {state.data.map((question, index) => (
                    <div key={question.qt_id} className={styles.questionCard}>
                      <div className={styles.questionHead}>
                        <span className={styles.qIndex}>{index + 1}</span>
                        <h3 className={styles.questionTitle}>
                          {question.content}
                        </h3>
                      </div>

                      <div className={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <label key={rating} className={styles.ratingPill}>
                            <input
                              type="radio"
                              name={`question-${question.qt_id}`}
                              value={rating}
                              onChange={() =>
                                handleRatingChange(question.qt_id, rating)
                              }
                              className={styles.ratingInput}
                            />
                            <span className={styles.ratingValue}>{rating}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className={styles.commentSection}>
                    <h3 className={styles.sectionTitle}>ข้อเสนอแนะเพิ่มเติม</h3>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="กรุณากรอกข้อเสนอแนะของท่าน..."
                      className={styles.textarea}
                    />
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={submitState.status === "submitting"}
                    >
                      {submitState.status === "submitting"
                        ? "Submitting..."
                        : "Submit Survey"}
                    </button>
                  </div>
                </>
              ) : (
                <p className={styles.noQuestions}>
                  No questions found for this exhibition survey.
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

