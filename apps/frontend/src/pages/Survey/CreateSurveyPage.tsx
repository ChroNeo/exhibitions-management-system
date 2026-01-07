import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useMasterQuestions } from "../../hook/useMasterQuestions";
import { useCreateQuestionSet } from "../../hook/useCreateQuestionSet";
import type { QuestionType } from "../../types/survey";

interface CustomQuestion {
  id: string;
  topic: string;
  isEditing: boolean;
}

export default function CreateSurveyPage() {
  const { exhibition_id } = useParams<{ exhibition_id: string }>();
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);

  const { data: masterQuestions, isLoading: isLoadingMaster } = useMasterQuestions(
    selectedType!,
    { enabled: !!selectedType }
  );

  const { mutateAsync: createQuestionSet, isPending: isCreating } = useCreateQuestionSet();

  useEffect(() => {
    if (isLoadingMaster) {
      Swal.fire({
        title: "Loading master questions...",
        didOpen: () => {
          Swal.showLoading();
        },
      });
    } else {
      Swal.close();
    }
  }, [isLoadingMaster]);

  const handleTypeSelect = (type: QuestionType) => {
    setSelectedType(type);
    setCustomQuestions([]);
  };

  const handleAddNewQuestion = () => {
    const newQuestion: CustomQuestion = {
      id: `custom-${Date.now()}`,
      topic: "",
      isEditing: true,
    };
    setCustomQuestions([...customQuestions, newQuestion]);
  };

  const handleUpdateQuestionTopic = (id: string, topic: string) => {
    setCustomQuestions(
      customQuestions.map((q) => (q.id === id ? { ...q, topic } : q))
    );
  };

  const handleConfirmQuestion = (id: string) => {
    const question = customQuestions.find((q) => q.id === id);
    if (!question?.topic.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Please enter a question topic",
        timer: 2000,
      });
      return;
    }

    setCustomQuestions(
      customQuestions.map((q) => (q.id === id ? { ...q, isEditing: false } : q))
    );
  };

  const handleDeleteQuestion = (id: string) => {
    setCustomQuestions(customQuestions.filter((q) => q.id !== id));
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      Swal.fire({
        icon: "warning",
        title: "Please select a survey type",
      });
      return;
    }

    if (!exhibition_id) {
      Swal.fire({
        icon: "error",
        title: "Exhibition ID not found",
      });
      return;
    }

    const hasEditingQuestions = customQuestions.some((q) => q.isEditing);
    if (hasEditingQuestions) {
      Swal.fire({
        icon: "warning",
        title: "Please confirm all questions before submitting",
      });
      return;
    }

    const allQuestions = [
      ...(masterQuestions || []).map((q) => ({ topic: q.topic })),
      ...customQuestions.map((q) => ({ topic: q.topic })),
    ];

    if (allQuestions.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Please add at least one question",
      });
      return;
    }

    try {
      await createQuestionSet({
        exhibition_id: parseInt(exhibition_id),
        type: selectedType,
        questions: allQuestions,
      });

      await Swal.fire({
        icon: "success",
        title: "Survey created successfully!",
        timer: 2000,
      });

      navigate(`/exhibitions/${exhibition_id}`);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to create survey",
        text: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <div style={styles.container}>
      <h1>Create Survey</h1>
      <p>Exhibition ID: {exhibition_id}</p>

      <div style={styles.section}>
        <h2>Select Survey Type</h2>
        <div style={styles.buttonGroup}>
          <button
            onClick={() => handleTypeSelect("EXHIBITION")}
            style={{
              ...styles.typeButton,
              ...(selectedType === "EXHIBITION" ? styles.typeButtonActive : {}),
            }}
          >
            Exhibition Survey
          </button>
          <button
            onClick={() => handleTypeSelect("UNIT")}
            style={{
              ...styles.typeButton,
              ...(selectedType === "UNIT" ? styles.typeButtonActive : {}),
            }}
          >
            Unit Survey
          </button>
        </div>
      </div>

      {selectedType && (
        <>
          <div style={styles.section}>
            <button onClick={handleAddNewQuestion} style={styles.addButton}>
              Add Question
            </button>
          </div>

          <div style={styles.section}>
            <h2>Questions</h2>

            {masterQuestions?.map((question) => (
              <div key={question.question_id} style={styles.questionItem}>
                <input
                  type="text"
                  value={question.topic}
                  disabled
                  placeholder="Topic"
                  style={styles.inputDisabled}
                />
                <input
                  type="text"
                  disabled
                  placeholder="Answer"
                  style={styles.inputDisabled}
                />
              </div>
            ))}

            {customQuestions.map((question) => (
              <div key={question.id} style={styles.questionItem}>
                <input
                  type="text"
                  value={question.topic}
                  onChange={(e) => handleUpdateQuestionTopic(question.id, e.target.value)}
                  disabled={!question.isEditing}
                  placeholder="Topic"
                  style={question.isEditing ? styles.input : styles.inputDisabled}
                />
                <input
                  type="text"
                  disabled
                  placeholder="Answer"
                  style={styles.inputDisabled}
                />
                <div style={styles.buttonGroup}>
                  {question.isEditing && (
                    <button
                      onClick={() => handleConfirmQuestion(question.id)}
                      style={styles.okButton}
                    >
                      OK
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.submitSection}>
            <button onClick={handleSubmit} disabled={isCreating} style={styles.createButton}>
              {isCreating ? "Creating..." : "Create Survey"}
            </button>
            <button onClick={() => navigate(`/exhibitions/${exhibition_id}`)} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    maxWidth: "800px",
    margin: "0 auto",
  },
  section: {
    marginBottom: "30px",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
  },
  typeButton: {
    padding: "10px 20px",
    backgroundColor: "#ddd",
    color: "black",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  typeButtonActive: {
    backgroundColor: "#4CAF50",
    color: "white",
  },
  addButton: {
    padding: "10px 20px",
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  questionItem: {
    marginBottom: "15px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
  },
  inputDisabled: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "#f5f5f5",
    color: "#666",
    cursor: "not-allowed",
    fontSize: "14px",
  },
  okButton: {
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "10px 20px",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  submitSection: {
    marginTop: "30px",
    display: "flex",
    gap: "10px",
  },
  createButton: {
    padding: "12px 30px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
  },
  cancelButton: {
    padding: "12px 30px",
    backgroundColor: "#9E9E9E",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
  },
};
