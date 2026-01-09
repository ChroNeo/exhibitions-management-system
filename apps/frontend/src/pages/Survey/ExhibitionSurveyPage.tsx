import { useState } from "react";
import { useSurveyLiff } from "../../hook/useSurveyLiff";

interface SurveyAnswer {
  question_id: number;
  rating: number;
}

export default function ExhibitionSurveyPage() {
  // Get exhibition_id from URL query string (same pattern as TicketPage)
  const params = new URLSearchParams(window.location.search);
  const exhibitionId = params.get("ex_id");

  const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
  const [comment, setComment] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Survey Answers:", answers);
    console.log("Comment:", comment);
    alert("Survey submitted! Check console for data.");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Exhibition Survey</h1>
      <p>กรุณาประเมินความพึงพอใจของท่าน</p>

      {state.status === "initializing" && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      {state.status === "not_logged_in" && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Loading login...</p>
        </div>
      )}

      {state.status === "loading" && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div className="spinner"></div>
          <p>Loading questions...</p>
        </div>
      )}

      {state.status === "error" && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🚫</div>
          <h3>Error</h3>
          <p style={{ color: "#d32f2f", marginBottom: "20px" }}>
            {state.message}
          </p>
          <button
            onClick={refetch}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {state.status === "success" && (
        <form onSubmit={handleSubmit}>
          {state.questions && state.questions.length > 0 ? (
          <>
            {state.questions.map((question, index) => (
              <div
                key={question.question_id}
                style={{
                  marginBottom: "30px",
                  padding: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <h3 style={{ marginBottom: "15px" }}>
                  {index + 1}. {question.topic}
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    justifyContent: "center",
                  }}
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label
                      key={rating}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${question.question_id}`}
                        value={rating}
                        onChange={() =>
                          handleRatingChange(question.question_id, rating)
                        }
                        style={{
                          width: "20px",
                          height: "20px",
                          marginBottom: "5px",
                          cursor: "pointer",
                        }}
                      />
                      <span style={{ fontSize: "16px", fontWeight: "500" }}>
                        {rating}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {/* Comment Section */}
            <div
              style={{
                marginBottom: "30px",
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <h3 style={{ marginBottom: "15px" }}>ข้อเสนอแนะเพิ่มเติม</h3>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="กรุณากรอกข้อเสนอแนะของท่าน..."
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "10px",
                  fontSize: "14px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  resize: "vertical",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: "12px 40px",
                fontSize: "16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Submit Survey
            </button>
          </>
        ) : (
          <p>No questions found for this exhibition survey.</p>
        )}
        </form>
      )}
    </div>
  );
}
