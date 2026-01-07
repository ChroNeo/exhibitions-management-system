import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { MdEdit, MdDelete, MdCheck } from "react-icons/md";
import { useMasterQuestions } from "../../hook/useMasterQuestions";
import { useCreateQuestionSet } from "../../hook/useCreateQuestionSet";
import type { QuestionType } from "../../types/survey";
import styles from "./CreateSurvey.module.css";

interface CustomQuestion {
  id: string;
  topic: string;
  isEditing: boolean;
  originalMasterId?: number;
}

export default function CreateSurveyPage() {
  const { exhibition_id } = useParams<{ exhibition_id: string }>();
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [excludedMasterIds, setExcludedMasterIds] = useState<number[]>([]);

  const { data: masterQuestions, isLoading: isLoadingMaster } =
    useMasterQuestions(selectedType!, { enabled: !!selectedType });

  const { mutateAsync: createQuestionSet, isPending: isCreating } =
    useCreateQuestionSet();

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
    setExcludedMasterIds([]);
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

  const handleEditQuestion = (id: string) => {
    setCustomQuestions(
      customQuestions.map((q) => (q.id === id ? { ...q, isEditing: true } : q))
    );
  };

  const handleEditMasterQuestion = (masterId: number, topic: string) => {
    // Mark master question as excluded and create editable custom version
    setExcludedMasterIds([...excludedMasterIds, masterId]);
    const newQuestion: CustomQuestion = {
      id: `master-${masterId}-${Date.now()}`,
      topic: topic,
      isEditing: true,
      originalMasterId: masterId,
    };
    setCustomQuestions([...customQuestions, newQuestion]);
  };

  const handleDeleteMasterQuestion = (masterId: number) => {
    setExcludedMasterIds([...excludedMasterIds, masterId]);
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
      ...(masterQuestions || [])
        .filter((q) => !excludedMasterIds.includes(q.question_id))
        .map((q) => ({ topic: q.topic })),
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
    <div className={styles.container}>
      <h1>Create Survey</h1>
      <p>Exhibition ID: {exhibition_id}</p>

      <div className={styles.section}>
        <h2>Select Survey Type</h2>
        <div className={styles.buttonGroup}>
          <button
            onClick={() => handleTypeSelect("EXHIBITION")}
            className={`${styles.typeButton} ${
              selectedType === "EXHIBITION" ? styles.typeButtonActive : ""
            }`}
          >
            Exhibition Survey
          </button>
          <button
            onClick={() => handleTypeSelect("UNIT")}
            className={`${styles.typeButton} ${
              selectedType === "UNIT" ? styles.typeButtonActive : ""
            }`}
          >
            Unit Survey
          </button>
        </div>
      </div>

      {selectedType && (
        <>
          <div className={styles.section}>
            <h2>Questions</h2>
            <div>
              {masterQuestions?.map((masterQuestion) => {
                // Check if this master question is being edited
                const editedVersion = customQuestions.find(
                  (q) => q.originalMasterId === masterQuestion.question_id
                );

                // If being edited, show the custom version
                if (editedVersion) {
                  const questionIndex =
                    masterQuestions?.findIndex(
                      (q) => q.question_id === editedVersion.originalMasterId
                    ) ?? 0;

                  return (
                    <div key={editedVersion.id} className={styles.questionItem}>
                      <div className={styles.inputGroup}>
                        {editedVersion.isEditing ? (
                          <input
                            type="text"
                            value={editedVersion.topic}
                            onChange={(e) =>
                              handleUpdateQuestionTopic(
                                editedVersion.id,
                                e.target.value
                              )
                            }
                            placeholder="Topic"
                            className={styles.input}
                          />
                        ) : (
                          <h2 className={styles.topicHeading}>
                            {questionIndex + 1}. {editedVersion.topic}
                          </h2>
                        )}
                        <div className={styles.ratingContainer}>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <label
                              key={rating}
                              className={styles.ratingOption}
                            >
                              <input
                                type="radio"
                                name={`question-${editedVersion.id}`}
                                value={rating}
                                disabled
                                className={styles.radioInput}
                              />
                              <span className={styles.ratingLabel}>{rating}</span>
                            </label>
                          ))}
                        </div>
                        <div className={styles.buttonGroup}>
                          {editedVersion.isEditing ? (
                            <button
                              onClick={() =>
                                handleConfirmQuestion(editedVersion.id)
                              }
                              className={styles.iconButtonOk}
                            >
                              <MdCheck size={20} />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleEditQuestion(editedVersion.id)
                              }
                              className={styles.iconButton}
                            >
                              <MdEdit size={20} />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteQuestion(editedVersion.id)
                            }
                            className={styles.iconButtonDelete}
                          >
                            <MdDelete size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // If deleted, don't show anything
                if (excludedMasterIds.includes(masterQuestion.question_id)) {
                  return null;
                }

                // Otherwise show the master question
                return (
                  <div
                    key={masterQuestion.question_id}
                    className={styles.questionItem}
                  >
                    <div className={styles.inputGroup}>
                      <h2 className={styles.topicHeading}>
                        {(masterQuestions?.findIndex(
                          (q) => q.question_id === masterQuestion.question_id
                        ) ?? -1) + 1}
                        . {masterQuestion.topic}
                      </h2>
                      <div className={styles.ratingContainer}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <label key={rating} className={styles.ratingOption}>
                            <input
                              type="radio"
                              name={`question-${masterQuestion.question_id}`}
                              value={rating}
                              disabled
                              className={styles.radioInput}
                            />
                            <span className={styles.ratingLabel}>{rating}</span>
                          </label>
                        ))}
                      </div>
                      <div className={styles.buttonGroup}>
                        <button
                          onClick={() =>
                            handleEditMasterQuestion(
                              masterQuestion.question_id,
                              masterQuestion.topic
                            )
                          }
                          className={styles.iconButton}
                        >
                          <MdEdit size={20} />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteMasterQuestion(
                              masterQuestion.question_id
                            )
                          }
                          className={styles.iconButtonDelete}
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {customQuestions
                .filter((q) => !q.originalMasterId)
                .map((question, index) => {
                  const totalMasterQuestions = masterQuestions?.length || 0;
                  const questionNumber = totalMasterQuestions + index + 1;

                  return (
                    <div key={question.id} className={styles.questionItem}>
                      <div className={styles.inputGroup}>
                        {question.isEditing ? (
                          <input
                            type="text"
                            value={question.topic}
                            onChange={(e) =>
                              handleUpdateQuestionTopic(
                                question.id,
                                e.target.value
                              )
                            }
                            placeholder="Topic"
                            className={styles.input}
                          />
                        ) : (
                          <h2 className={styles.topicHeading}>
                            {questionNumber}. {question.topic}
                          </h2>
                        )}
                        <div className={styles.ratingContainer}>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <label key={rating} className={styles.ratingOption}>
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={rating}
                                disabled
                                className={styles.radioInput}
                              />
                              <span className={styles.ratingLabel}>{rating}</span>
                            </label>
                          ))}
                        </div>
                        <div className={styles.buttonGroup}>
                          {question.isEditing ? (
                            <button
                              onClick={() => handleConfirmQuestion(question.id)}
                              className={styles.iconButtonOk}
                            >
                              <MdCheck size={20} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEditQuestion(question.id)}
                              className={styles.iconButton}
                            >
                              <MdEdit size={20} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className={styles.iconButtonDelete}
                          >
                            <MdDelete size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className={styles.section}>
              <button onClick={handleAddNewQuestion} className={styles.addButton}>
                Add Question
              </button>
            </div>
          </div>

          <div className={styles.submitSection}>
            <button
              onClick={handleSubmit}
              disabled={isCreating}
              className={styles.createButton}
            >
              {isCreating ? "Creating..." : "Create Survey"}
            </button>
            <button
              onClick={() => navigate(`/exhibitions/${exhibition_id}`)}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
