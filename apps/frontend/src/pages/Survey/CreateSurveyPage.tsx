import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { MdAddCircleOutline } from "react-icons/md";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { createQuestionsTemplateApi } from "../../api/survey";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const handleTypeSelect = useCallback((type: QuestionType) => {
    setSelectedType(type);
    setSelectedSetId(null);
    setCustomQuestions([]);
    setExcludedMasterIds([]);
    setHasLoadedExisting(false);
  }, []);

  useEffect(() => {
    if (masterQuestionSets && masterQuestionSets.length > 0 && !selectedSetId) {
      setSelectedSetId(masterQuestionSets[0].set_id);
    }
  }, [masterQuestionSets, selectedSetId]);

  const handleAddNewQuestion = useCallback(() => {
    const newQuestion: CustomQuestion = {
      id: `custom-${Date.now()}`,
      topic: "",
      isEditing: true,
    };
    setCustomQuestions((prev) => [...prev, newQuestion]);
  }, []);

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
          title: "กรุณากรอกหัวข้อคำถาม",
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
        topic,
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

  const visibleMasterQuestions = useMemo(() => {
    if (!masterQuestions) return [];
    return masterQuestions.filter((q) => !excludedMasterIds.includes(q.qt_id));
  }, [masterQuestions, excludedMasterIds]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      if (isEditMode && hasLoadedExisting) {
        setCustomQuestions((items) => {
          const oldIndex = items.findIndex(
            (item) => String(item.id) === active.id,
          );
          const newIndex = items.findIndex(
            (item) => String(item.id) === over.id,
          );
          return arrayMove(items, oldIndex, newIndex);
        });
      } else {
        const allItems = [
          ...visibleMasterQuestions.map((q) => ({
            id: String(q.qt_id),
            type: "master" as const,
            data: q,
          })),
          ...customQuestions
            .filter((q) => !q.originalMasterId)
            .map((q) => ({ id: q.id, type: "custom" as const, data: q })),
        ];

        const oldIndex = allItems.findIndex((item) => item.id === active.id);
        const newIndex = allItems.findIndex((item) => item.id === over.id);
        const reordered = arrayMove(allItems, oldIndex, newIndex);

        const newExcludedIds: number[] = [];
        const newCustomQuestions: CustomQuestion[] = [];

        reordered.forEach((item) => {
          if (item.type === "master") {
            const wasExcluded = excludedMasterIds.includes(item.data.qt_id);
            if (wasExcluded) {
              newExcludedIds.push(item.data.qt_id);
            }
          } else {
            newCustomQuestions.push(item.data);
          }
        });

        setExcludedMasterIds(newExcludedIds);
        setCustomQuestions(newCustomQuestions);
      }
    },
    [
      isEditMode,
      hasLoadedExisting,
      visibleMasterQuestions,
      customQuestions,
      excludedMasterIds,
    ],
  );

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

  const handleSubmit = useCallback(async () => {
    if (!selectedType) {
      Swal.fire({ icon: "warning", title: "กรุณาเลือกประเภทแบบสอบถาม" });
      return;
    }

    if (!exhibition_id) {
      Swal.fire({ icon: "error", title: "ไม่พบ Exhibition ID" });
      return;
    }

    const exhibitionIdNum = parseInt(exhibition_id, 10);
    if (isNaN(exhibitionIdNum)) {
      Swal.fire({ icon: "error", title: "Exhibition ID ไม่ถูกต้อง" });
      return;
    }

    const hasEditingQuestions = customQuestions.some((q) => q.isEditing);
    if (hasEditingQuestions) {
      Swal.fire({
        icon: "warning",
        title: "กรุณายืนยันคำถามให้ครบก่อนบันทึก",
      });
      return;
    }

    if (allQuestionsList.length === 0) {
      Swal.fire({ icon: "warning", title: "กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ" });
      return;
    }

    try {
      // Build a map of original content by qt_id to detect edits
      const originalContentMap = new Map<number, string>();
      if (existingQuestions) {
        existingQuestions.forEach((q) => {
          originalContentMap.set(q.qt_id, q.content);
        });
      }

      // Find questions that need new qt_ids:
      // 1. Brand new questions (no qt_id)
      // 2. Existing questions whose content was edited
      const questionsNeedingNewId = customQuestions.filter((q) => {
        if (!q.qt_id && q.topic.trim()) return true; // new question
        if (q.qt_id && originalContentMap.has(q.qt_id)) {
          return q.topic.trim() !== originalContentMap.get(q.qt_id)!.trim();
        }
        return false;
      });

      // Create new template entries for all modified/new questions
      const qtIdMap = new Map<string, number>();
      if (questionsNeedingNewId.length > 0) {
        const payload = questionsNeedingNewId.map((q) => ({
          content: q.topic,
          category: null,
        }));

        const created = await createQuestionsTemplateApi(payload);
        questionsNeedingNewId.forEach((q, index) => {
          qtIdMap.set(q.id, created[index].qt_id);
        });
      }

      // Build final questions list, replacing qt_ids for modified questions
      let finalQuestionsList: { qt_id: number; sort_order: number }[];

      if (isEditMode && hasLoadedExisting) {
        finalQuestionsList = customQuestions
          .map((q, i) => ({
            qt_id: qtIdMap.get(q.id) ?? q.qt_id!,
            sort_order: i + 1,
          }))
          .filter((q) => q.qt_id != null);
      } else {
        // Create mode: master questions + new custom questions
        const newQuestionsWithIds = questionsNeedingNewId.map((q, i) => ({
          qt_id: qtIdMap.get(q.id)!,
          sort_order: allQuestionsList.length + i + 1,
        }));
        finalQuestionsList = [...allQuestionsList, ...newQuestionsWithIds];
      }

      if (isEditMode) {
        await updateQuestionSet({
          exhibition_id: exhibitionIdNum,
          type: selectedType,
          questions: finalQuestionsList,
        });

        await Swal.fire({
          icon: "success",
          title: "อัปเดตแบบสอบถามเรียบร้อย",
          timer: 1800,
        });
      } else {
        await createQuestionSet({
          exhibition_id: exhibitionIdNum,
          type: selectedType,
          questions: finalQuestionsList,
        });

        await Swal.fire({
          icon: "success",
          title: "สร้างแบบสอบถามเรียบร้อย",
          timer: 1800,
        });
      }

      navigate(`/exhibitions/${exhibition_id}`);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: isEditMode ? "อัปเดตไม่สำเร็จ" : "สร้างไม่สำเร็จ",
        text: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [
    selectedType,
    exhibition_id,
    customQuestions,
    allQuestionsList,
    isEditMode,
    hasLoadedExisting,
    existingQuestions,
    updateQuestionSet,
    createQuestionSet,
    navigate,
  ]);

  const surveyTypeLabel = useMemo(
    () =>
      selectedType === "EXHIBITION" ? "แบบสอบถามนิทรรศการ" : "แบบสอบถามบูธ",
    [selectedType],
  );

  const sortableItems = useMemo(() => {
    if (isEditMode && hasLoadedExisting) {
      return customQuestions.map((q) => String(q.id));
    }
    return [
      ...visibleMasterQuestions.map((q) => String(q.qt_id)),
      ...customQuestions.filter((q) => !q.originalMasterId).map((q) => q.id),
    ];
  }, [isEditMode, hasLoadedExisting, customQuestions, visibleMasterQuestions]);

  return (
    <>
      <HeaderBar active="exhibition_unit" />
      <div className={styles.pageBg}>
        <div className={styles.container}>
          {isLoading && (
            <LoadingOverlay
              message={
                isEditMode ? "กำลังโหลดคำถามเดิม..." : "กำลังโหลดคำถามต้นแบบ..."
              }
            />
          )}

          <div className={styles.headerRow}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(-1)}
              aria-label="ย้อนกลับ"
            >
              <IoArrowBack />
            </button>

            <div className={styles.header}>
              <h1 className={styles.headerTitle}>
                {isEditMode ? "แก้ไข" : "สร้าง"}
                {typeFromQuery ? surveyTypeLabel : "แบบสอบถาม"}
              </h1>
            </div>
          </div>

          {!typeFromQuery && (
            <div className={styles.card}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Select Survey Type</h2>

                <div className={styles.buttonGroup}>
                  <button
                    onClick={() => handleTypeSelect("EXHIBITION")}
                    className={`${styles.typeButton} ${
                      selectedType === "EXHIBITION"
                        ? styles.typeButtonActive
                        : ""
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
            </div>
          )}

          {selectedType && (
            <div className={styles.typePanel}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>เลือกชุดคำถาม</h2>

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
                    เลือกชุดคำถาม
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
                  <h2 className={styles.sectionTitle}>คำถาม</h2>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={sortableItems}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className={styles.questionsWrap}>
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
                                    handleUpdateQuestionTopic(
                                      editedVersion.id,
                                      value,
                                    )
                                  }
                                  onConfirm={() =>
                                    handleConfirmQuestion(editedVersion.id)
                                  }
                                  onEdit={() =>
                                    handleEditQuestion(editedVersion.id)
                                  }
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
                                id={String(masterQuestion.qt_id)}
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
                          .filter(
                            (q) => hasLoadedExisting || !q.originalMasterId,
                          )
                          .map((question, index) => {
                            const totalMasterQuestions = hasLoadedExisting
                              ? 0
                              : masterQuestions?.length || 0;
                            const questionNumber =
                              totalMasterQuestions + index + 1;

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
                                onConfirm={() =>
                                  handleConfirmQuestion(question.id)
                                }
                                onEdit={() => handleEditQuestion(question.id)}
                                onDelete={() =>
                                  handleDeleteQuestion(question.id)
                                }
                              />
                            );
                          })}
                      </div>
                    </SortableContext>
                  </DndContext>

                  <div className={styles.actionsRow}>
                    <button onClick={handleAddNewQuestion} className="toolBtn">
                      <MdAddCircleOutline />
                      เพิ่มคำถาม
                    </button>
                  </div>
                </div>
              )}

              {selectedSetId && (
                <div className={styles.submitSection}>
                  <button
                    onClick={handleSubmit}
                    disabled={isCreating || isUpdating}
                    className="toolBtn"
                  >
                    {isCreating || isUpdating
                      ? isEditMode
                        ? "กำลังอัปเดต..."
                        : "กำลังสร้าง..."
                      : isEditMode
                        ? "อัปเดตแบบสอบถาม"
                        : "สร้างแบบสอบถาม"}
                  </button>

                  <button
                    onClick={() => navigate(`/exhibitions/${exhibition_id}`)}
                    className="toolBtn toolBtnDanger"
                  >
                    ยกเลิก
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
