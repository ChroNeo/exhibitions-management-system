import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";
import axios from "axios";
import Swal from "sweetalert2";
import { useSurveyLiff } from "./hooks";
import { submitSurveyLiff } from "../../api/survey";
import { LIFF_CONFIG as LIFF_IDS } from "../../config/liff";
import styles from "./ExhibitionSurvey.module.css";

const API_BASE = import.meta.env.VITE_BASE;

interface SurveyAnswer {
  question_id: number;
  rating: number;
}

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" };

export default function ExhibitionSurveyPage() {
  const [exhibitionId, setExhibitionId] = useState<string | null>(null);
  const [fetchingExhibition, setFetchingExhibition] = useState(true);

  // Fetch current exhibition ID from API
  useEffect(() => {
    async function fetchCurrentExhibition() {
      try {
        if (!liff.id) {
          await liff.init({ liffId: LIFF_IDS.SURVEY });
        }
        if (!liff.isLoggedIn()) return;
        const idToken = liff.getIDToken();
        if (!idToken) return;
        const res = await axios.get<{ current_exhibition_id: number | null }>(
          `${API_BASE}/api/v1/ticket/current-exhibition`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "ngrok-skip-browser-warning": "true",
            },
          },
        );
        if (res.data.current_exhibition_id) {
          setExhibitionId(String(res.data.current_exhibition_id));
        }
      } catch (err) {
        console.error("Failed to fetch current exhibition:", err);
      } finally {
        setFetchingExhibition(false);
      }
    }
    fetchCurrentExhibition();
  }, []);

  useEffect(() => {
    if (fetchingExhibition) {
      Swal.fire({
        title: "Loading...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
    } else {
      Swal.close();
      if (!exhibitionId) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No current exhibition found",
        });
      }
    }
  }, [fetchingExhibition, exhibitionId]);

  if (fetchingExhibition || !exhibitionId) {
    return null;
  }

  return <ExhibitionSurveyContent exhibitionId={exhibitionId} />;
}

function ExhibitionSurveyContent({ exhibitionId }: { exhibitionId: string }) {
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
  const [comment, setComment] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  // Use the custom LIFF hook
  const { state, refetch } = useSurveyLiff({
    exhibitionId,
  });

  const handleRatingChange = (questionId: number, rating: number) => {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.question_id === questionId);
      if (existing) {
        return prev.map((a) =>
          a.question_id === questionId ? { ...a, rating } : a
        );
      }
      return [...prev, { question_id: questionId, rating }];
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
          question_id: a.question_id,
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
    <div className={styles.container}>
      <h1>Exhibition Survey</h1>
      <p>กรุณาประเมินความพึงพอใจของท่าน</p>

      {state.status === "initializing" && (
        <div className={styles.statusMessage}>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      {state.status === "not_logged_in" && (
        <div className={styles.statusMessage}>
          <p>Loading login...</p>
        </div>
      )}

      {state.status === "loading" && (
        <div className={styles.statusMessage}>
          <div className="spinner"></div>
          <p>Loading questions...</p>
        </div>
      )}

      {state.status === "error" && (
        <div className={styles.statusMessage}>
          <div className={styles.errorIcon}>🚫</div>
          <h3>Error</h3>
          <p className={styles.errorMessage}>
            {state.message}
          </p>
          <button onClick={refetch} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      )}

      {state.status === "success" && (
        <>
            <form onSubmit={handleSubmit}>
              {state.data && state.data.length > 0 ? (
              <>
                {state.data.map((question, index) => (
              <div key={question.question_id} className={styles.questionCard}>
                <h3 className={styles.questionTitle}>
                  {index + 1}. {question.topic}
                </h3>
                <div className={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className={styles.ratingLabel}>
                      <input
                        type="radio"
                        name={`question-${question.question_id}`}
                        value={rating}
                        onChange={() =>
                          handleRatingChange(question.question_id, rating)
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

            {/* Comment Section */}
            <div className={styles.commentSection}>
              <h3 className={styles.commentTitle}>ข้อเสนอแนะเพิ่มเติม</h3>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="กรุณากรอกข้อเสนอแนะของท่าน..."
                className={styles.commentTextarea}
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitState.status === "submitting"}
            >
              {submitState.status === "submitting" ? "Submitting..." : "Submit Survey"}
            </button>
          </>
        ) : (
          <p className={styles.noQuestions}>No questions found for this exhibition survey.</p>
        )}
            </form>
        </>
      )}
    </div>
  );
}
