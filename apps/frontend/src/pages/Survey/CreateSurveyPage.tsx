import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import type { QuestionType } from "../../types/survey";
import { LoadingOverlay, QuestionItem } from "./components";
import styles from "./CreateSurvey.module.css";
import {
  useCreateQuestionSet,
  useMasterQuestions,
  useSurveyQuestions,
  useUpdateQuestionSet,
} from "./hooks";

interface CustomQuestion {
  id: string;
  topic: string;
  qt_id?: number;
  isEditing: boolean;
  originalMasterId?: number;
}

export default function CreateSurveyPage() {
  const { exhibition_id } = useParams<{ exhibition_id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isEditMode = searchParams.get("edit") === "true";
  const typeFromQuery = searchParams.get("type") as QuestionType | null;

  const [selectedType, setSelectedType] = useState<QuestionType | null>(
    typeFromQuery || null,
  );
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [excludedMasterIds, setExcludedMasterIds] = useState<number[]>([]);
  const [hasLoadedExisting, setHasLoadedExisting] = useState(false);

  const { data: masterQuestionSets, isLoading: isLoadingMaster } =
    useMasterQuestions(selectedType!, { enabled: !!selectedType });

  const masterQuestions = useMemo(() => {
    const selectedMasterSet = masterQuestionSets?.find(
      (set) => set.set_id === selectedSetId,
    );
    return selectedMasterSet?.questions || [];
  }, [masterQuestionSets, selectedSetId]);

  const { data: existingQuestions, isLoading: isLoadingExisting } =
    useSurveyQuestions(
      {
        exhibition_id: exhibition_id!,
        type: selectedType!,
      },
      { enabled: isEditMode && !!selectedType },
    );

  const { mutateAsync: createQuestionSet, isPending: isCreating } =
    useCreateQuestionSet();

  const { mutateAsync: updateQuestionSet, isPending: isUpdating } =
    useUpdateQuestionSet();

  const isLoading = isLoadingMaster || isLoadingExisting;

  // Populate form with existing questions in edit mode
  useEffect(() => {
    if (isEditMode && existingQuestions && existingQuestions.length > 0) {
      const existingCustomQuestions: CustomQuestion[] = existingQuestions.map(
        (q) => ({
          id: `existing-${q.qt_id}`,
          topic: q.content,
          qt_id: q.qt_id,
          isEditing: false,
          originalMasterId: q.is_master ? q.qt_id : undefined,
        }),
      );
      setCustomQuestions(existingCustomQuestions);
      setHasLoadedExisting(true);
    }
  }, [isEditMode, existingQuestions]);

  const handleTypeSelect = (type: QuestionType) => {
    setSelectedType(type);
    setSelectedSetId(null);
    setCustomQuestions([]);
    setExcludedMasterIds([]);
  };

  useEffect(() => {
    if (masterQuestionSets && masterQuestionSets.length > 0 && !selectedSetId) {
      setSelectedSetId(masterQuestionSets[0].set_id);
    }
  }, [masterQuestionSets, selectedSetId]);

  const handleAddNewQuestion = () => {
    const newQuestion: CustomQuestion = {
      id: `custom-${Date.now()}`,
      topic: "",
      isEditing: true,
    };
    setCustomQuestions([...customQuestions, newQuestion]);
  };

  const handleUpdateQuestionTopic = useCallback((id: string, topic: string) => {
    setCustomQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, topic } : q)),
    );
  }, []);

  const handleConfirmQuestion = useCallback((id: string) => {
    setCustomQuestions((prev) => {
      const question = prev.find((q) => q.id === id);
      if (!question?.topic.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Please enter a question topic",
          timer: 2000,
        });
        return prev;
      }

      return prev.map((q) => (q.id === id ? { ...q, isEditing: false } : q));
    });
  }, []);

  const handleDeleteQuestion = useCallback((id: string) => {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const handleEditQuestion = useCallback((id: string) => {
    setCustomQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isEditing: true } : q)),
    );
  }, []);

  const handleEditMasterQuestion = useCallback(
    (masterId: number, topic: string) => {
      setExcludedMasterIds((prev) => [...prev, masterId]);
      const newQuestion: CustomQuestion = {
        id: `master-${masterId}-${Date.now()}`,
        topic: topic,
        qt_id: masterId,
        isEditing: true,
        originalMasterId: masterId,
      };
      setCustomQuestions((prev) => [...prev, newQuestion]);
    },
    [],
  );

  const handleDeleteMasterQuestion = useCallback((masterId: number) => {
    setExcludedMasterIds((prev) => [...prev, masterId]);
  }, []);

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

    const exhibitionIdNum = parseInt(exhibition_id, 10);
    if (isNaN(exhibitionIdNum)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Exhibition ID",
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

    if (allQuestionsList.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Please add at least one question",
      });
      return;
    }

    try {
      if (isEditMode) {
        await updateQuestionSet({
          exhibition_id: exhibitionIdNum,
          type: selectedType,
          questions: allQuestionsList,
        });

        await Swal.fire({
          icon: "success",
          title: "Survey updated successfully!",
          timer: 2000,
        });
      } else {
        await createQuestionSet({
          exhibition_id: exhibitionIdNum,
          type: selectedType,
          questions: allQuestionsList,
        });

        await Swal.fire({
          icon: "success",
          title: "Survey created successfully!",
          timer: 2000,
        });
      }

      navigate(`/exhibitions/${exhibition_id}`);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: isEditMode
          ? "Failed to update survey"
          : "Failed to create survey",
        text: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const visibleMasterQuestions = useMemo(() => {
    if (!masterQuestions) return [];
    return masterQuestions.filter(
      (q) => !excludedMasterIds.includes(q.qt_id),
    );
  }, [masterQuestions, excludedMasterIds]);

  // Build the final questions list as { qt_id, sort_order }
  const allQuestionsList = useMemo(() => {
    if (isEditMode && hasLoadedExisting) {
      return customQuestions
        .filter((q) => q.qt_id != null)
        .map((q, i) => ({ qt_id: q.qt_id!, sort_order: i + 1 }));
    }
    const masterList = visibleMasterQuestions.map((q, i) => ({
      qt_id: q.qt_id,
      sort_order: i + 1,
    }));
    const customList = customQuestions
      .filter((q) => q.qt_id != null)
      .map((q, i) => ({
        qt_id: q.qt_id!,
        sort_order: masterList.length + i + 1,
      }));
    return [...masterList, ...customList];
  }, [isEditMode, hasLoadedExisting, customQuestions, visibleMasterQuestions]);

  const surveyTypeLabel =
    selectedType === "EXHIBITION" ? "แบบสอบถามนิทรรศการ" : "แบบสอบถามบูธ";

  return (
    <div className={styles.pageBg}>
      <div className={styles.container}>
        {isLoading && (
          <LoadingOverlay
            message={
              isEditMode
                ? "Loading existing questions..."
                : "Loading master questions..."
            }
          />
        )}
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            ←
          </button>
          <h1 className={styles.headerTitle}>
            {isEditMode ? "แก้ไข" : "สร้าง"}
            {typeFromQuery ? surveyTypeLabel : "แบบสอบถาม"}
          </h1>
        </div>

        <p className={styles.subTitle}>Exhibition ID: {exhibition_id}</p>

        {!typeFromQuery && (
          <div className={styles.section}>
            <h2>Select Survey Type</h2>
            <div className={styles.buttonGroup}>
              <button
                onClick={() => handleTypeSelect("EXHIBITION")}
                className={`${styles.typeButton} ${
                  selectedType === "EXHIBITION" ? styles.typeButtonActive : ""
                }`}
                disabled={isEditMode}
              >
                Exhibition Survey
              </button>
              <button
                onClick={() => handleTypeSelect("UNIT")}
                className={`${styles.typeButton} ${
                  selectedType === "UNIT" ? styles.typeButtonActive : ""
                }`}
                disabled={isEditMode}
              >
                Unit Survey
              </button>
            </div>
          </div>
        )}

        {selectedType && (
          <div className={styles.typePanel}>
            <div className={styles.section}>
              <h2>Select Template</h2>
              <select
                value={selectedSetId || ""}
                onChange={async (e) => {
                  const newSetId = Number(e.target.value);

                  if (isEditMode) {
                    const result = await Swal.fire({
                      title: "เปลี่ยน Template?",
                      text: "การเปลี่ยน template จะแทนที่คำถามทั้งหมดที่คุณแก้ไขแล้ว คุณแน่ใจหรือไม่?",
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonText: "ใช่, เปลี่ยนเลย",
                      cancelButtonText: "ยกเลิก",
                      confirmButtonColor: "#ef4444",
                    });

                    if (result.isConfirmed) {
                      setSelectedSetId(newSetId);
                      setCustomQuestions([]);
                      setExcludedMasterIds([]);
                      setHasLoadedExisting(false);
                    }
                  } else {
                    setSelectedSetId(newSetId);
                  }
                }}
                className={styles.dropdown}
              >
                <option value="" disabled>
                  Select a question template
                </option>
                {masterQuestionSets?.map((set) => (
                  <option key={set.set_id} value={set.set_id}>
                    {set.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedSetId && (
              <div className={styles.section}>
                <h2>Questions</h2>
                <div>
                  {(!isEditMode || !hasLoadedExisting) &&
                    masterQuestions?.map((masterQuestion, index) => {
                      const editedVersion = customQuestions.find(
                        (q) =>
                          q.originalMasterId === masterQuestion.qt_id,
                      );

                      if (editedVersion) {
                        return (
                          <QuestionItem
                            key={editedVersion.id}
                            id={editedVersion.id}
                            topic={editedVersion.topic}
                            questionNumber={index + 1}
                            isEditing={editedVersion.isEditing}
                            onUpdateTopic={(value) =>
                              handleUpdateQuestionTopic(editedVersion.id, value)
                            }
                            onConfirm={() =>
                              handleConfirmQuestion(editedVersion.id)
                            }
                            onEdit={() => handleEditQuestion(editedVersion.id)}
                            onDelete={() =>
                              handleDeleteQuestion(editedVersion.id)
                            }
                          />
                        );
                      }

                      if (
                        excludedMasterIds.includes(masterQuestion.qt_id)
                      ) {
                        return null;
                      }

                      return (
                        <QuestionItem
                          key={masterQuestion.qt_id}
                          id={masterQuestion.qt_id}
                          topic={masterQuestion.content}
                          questionNumber={index + 1}
                          isEditing={false}
                          onUpdateTopic={() => {}}
                          onConfirm={() => {}}
                          onEdit={() =>
                            handleEditMasterQuestion(
                              masterQuestion.qt_id,
                              masterQuestion.content,
                            )
                          }
                          onDelete={() =>
                            handleDeleteMasterQuestion(
                              masterQuestion.qt_id,
                            )
                          }
                        />
                      );
                    })}

                  {customQuestions
                    .filter((q) => hasLoadedExisting || !q.originalMasterId)
                    .map((question, index) => {
                      const totalMasterQuestions = hasLoadedExisting
                        ? 0
                        : masterQuestions?.length || 0;
                      const questionNumber = totalMasterQuestions + index + 1;

                      return (
                        <QuestionItem
                          key={question.id}
                          id={question.id}
                          topic={question.topic}
                          questionNumber={questionNumber}
                          isEditing={question.isEditing}
                          onUpdateTopic={(value) =>
                            handleUpdateQuestionTopic(question.id, value)
                          }
                          onConfirm={() => handleConfirmQuestion(question.id)}
                          onEdit={() => handleEditQuestion(question.id)}
                          onDelete={() => handleDeleteQuestion(question.id)}
                        />
                      );
                    })}
                </div>
                <div className={styles.section}>
                  <button
                    onClick={handleAddNewQuestion}
                    className={styles.addButton}
                  >
                    Add Question
                  </button>
                </div>
              </div>
            )}

            {selectedSetId && (
              <div className={styles.submitSection}>
                <button
                  onClick={handleSubmit}
                  disabled={isCreating || isUpdating}
                  className={styles.createButton}
                >
                  {isCreating || isUpdating
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                      ? "Update Survey"
                      : "Create Survey"}
                </button>
                <button
                  onClick={() => navigate(`/exhibitions/${exhibition_id}`)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
