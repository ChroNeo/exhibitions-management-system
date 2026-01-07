import { useState } from "react";
import { useParams } from "react-router-dom";
import { useSurveyQuestions } from "../../hook/useSurveyQuestions";

interface SurveyAnswer {
  question_id: number;
  rating: number;
}

export default function ExhibitionSurveyPage() {
  const { ex_id } = useParams<{ ex_id: string }>();
  const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
  const [comment, setComment] = useState("");

  const { data: questions, isLoading, error } = useSurveyQuestions({
    exhibition_id: ex_id!,
    type: "EXHIBITION",
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

  if (isLoading) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Exhibition Survey</h1>
        <p>Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Exhibition Survey</h1>
        <p>Error loading questions: {error.message}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Exhibition Survey</h1>
      <p>กรุณาประเมินความพึงพอใจของท่าน</p>

      <form onSubmit={handleSubmit}>
        {questions && questions.length > 0 ? (
          <>
            {questions.map((question, index) => (
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
    </div>
  );
}
