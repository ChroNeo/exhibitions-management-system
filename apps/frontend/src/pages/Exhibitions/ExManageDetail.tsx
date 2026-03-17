import liff from "@line/liff";
import { ArrowLeft } from "lucide-react";
import type QuillType from "quill";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaBullhorn,
  FaCertificate,
  FaClipboardList,
  FaEdit,
} from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import type { ExhibitionFormValues } from "../../components/exhibition/detail_form/ExhibitionForm";
import ExhibitionForm from "../../components/exhibition/detail_form/ExhibitionForm";
import type { EditFormState } from "../../components/exhibition/ExhibitionDetailCard";
import ExhibitionDetailCard from "../../components/exhibition/ExhibitionDetailCard";
import cardStyles from "../../components/exhibition/ExhibitionDetailCard.module.css";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import NotFound from "../../components/NotFound";
import SurveyManageModal from "../../components/SurveyManageModal/SurveyManageModal";
import {
  useAuthStatus,
  useAuthUser,
  useDeleteExhibition,
  useExhibition,
} from "../../hooks";
import type { Exhibition } from "../../types/exhibition";
import type { Mode } from "../../types/mode";
import { toApiDateTime, toInputDateTime } from "../../utils/date";
import { initializeRichTextEditor } from "../../utils/quill";
import { toDeltaObject } from "../../utils/quillDelta";
import { toFileUrl } from "../../utils/url";
import UnitManageList from "../Units/UnitManageList";
import styles from "./ExManageDetail.module.css";
import { useCreateExhibition, useUpdateExhibition } from "./hooks";

const DEFAULT_STATUS = "draft";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  ongoing: "Ongoing",
  ended: "Ended",
  archived: "Archived",
};

type ExManageDetailProps = { mode?: Mode };

export default function ExManageDetail({ mode = "view" }: ExManageDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [isInClient, setIsInClient] = useState(false);
  // ── Inline edit state ──
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [imagePreview, setImagePreview] = useState<string>();
  const quillContainerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<QuillType | null>(null);

  // ── Data hooks ──
  const { mutateAsync: deleteExhibitionAsync } = useDeleteExhibition();
  const shouldFetch = mode !== "create" && !!id;
  const { data, isLoading, isError } = useExhibition(id ?? "", {
    enabled: shouldFetch,
  });

  useEffect(() => {
    if (isLoading) {
      Swal.fire({
        title: "กำลังโหลด",
        didOpen: () => {
          Swal.showLoading();
        },
      });
    } else {
      Swal.close();
    }
    setIsInClient(liff.isInClient());
  }, [isLoading]);

  const { mutateAsync: createExh } = useCreateExhibition();
  const { mutateAsync: updateExh } = useUpdateExhibition();
  const authUser = useAuthUser();
  const descriptionPlain = data?.description?.trim() || undefined;
  const descriptionHtml = data?.descriptionHtml;

  const toISO = (value?: string | number | Date | null): string | undefined => {
    if (value === undefined || value === null) return undefined;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
  };

  const pageTitle = isEditing
    ? "แก้ไขนิทรรศการ"
    : mode === "create"
      ? "เพิ่มนิทรรศการ"
      : "รายละเอียดนิทรรศการ";

  // ── Create mode form values ──
  const { initialValues, initialFileName, initialDetailPdfName } =
    useMemo(() => {
      if (!data || mode === "create") {
        return {
          initialValues: undefined,
          initialFileName: undefined,
          initialDetailPdfName: undefined,
        };
      }
      const ex = data as Exhibition;
      const picturePath = ex.picture_path ?? "";
      const fileName = picturePath
        ? picturePath.split("/").pop() || picturePath
        : undefined;
      const detailPdfName = ex.detailPdfUrl
        ? ex.detailPdfUrl.split("/").pop() || ex.detailPdfUrl
        : undefined;

      return {
        initialValues: {
          title: ex.title ?? "",
          start_date: toInputDateTime(toISO(ex.start_date) ?? null),
          end_date: toInputDateTime(toISO(ex.end_date) ?? null),
          location: ex.location ?? "",
          organizer_name: ex.organizer_name ?? "",
          description: ex.descriptionHtml ?? "",
          description_delta: ex.descriptionDelta ?? "",
          status: ex.status ?? DEFAULT_STATUS,
          file: undefined,
        },
        initialFileName: fileName,
        initialDetailPdfName: detailPdfName,
      };
    }, [data, mode]);

  // ── Quill lifecycle ──
  useEffect(() => {
    if (!isEditing) {
      // Cleanup on exit
      if (quillRef.current) {
        quillRef.current = null;
      }
      return;
    }

    // Wait for DOM to be ready
    const raf = requestAnimationFrame(() => {
      const container = quillContainerRef.current;
      if (!container || quillRef.current) return;

      const { quill, cleanup } = initializeRichTextEditor({
        container,
        placeholder: "รายละเอียดเพิ่มเติมของนิทรรศการ",
      });

      // Hydrate with existing content
      if (data) {
        const deltaRaw = data.descriptionDelta;
        if (deltaRaw) {
          const deltaObj = toDeltaObject(deltaRaw);
          quill.setContents(deltaObj, "silent");
        } else if (data.descriptionHtml) {
          const clip = quill.clipboard.convert({ html: data.descriptionHtml });
          quill.setContents(clip, "silent");
        }
      }

      quillRef.current = quill;

      // Store cleanup for when effect re-runs
      return cleanup;
    });

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [isEditing, data]);

  // ── Inline edit handlers ──
  const handleStartEdit = useCallback(() => {
    if (!data) return;
    setEditForm({
      title: data.title ?? "",
      start_date: toInputDateTime(toISO(data.start_date) ?? null),
      end_date: toInputDateTime(toISO(data.end_date) ?? null),
      location: data.location ?? "",
      organizer_name: data.organizer_name ?? "",
      status: data.status ?? DEFAULT_STATUS,
    });
    setIsEditing(true);
  }, [data]);

  // ── Auto-start edit when ?edit=true ──
  useEffect(() => {
    if (searchParams.get("edit") === "true" && data && !isEditing) {
      handleStartEdit();
    }
  }, [searchParams, data, isEditing, handleStartEdit]);

  const handleCancelInlineEdit = useCallback(() => {
    setIsEditing(false);
    setEditForm(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(undefined);
    }
    quillRef.current = null;
    if (searchParams.get("edit") === "true") {
      navigate(`/exhibitions/${id}`, { replace: true });
    }
  }, [imagePreview, searchParams, navigate, id]);

  const handleFieldChange = useCallback((field: string, value: string) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const handleFileChange = useCallback((file: File | undefined) => {
    setEditForm((prev) => (prev ? { ...prev, file } : prev));
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : undefined;
    });
  }, []);

  const handlePdfFileChange = useCallback((file: File | undefined) => {
    setEditForm((prev) =>
      prev ? { ...prev, detailPdfFile: file, detailPdfRemoved: false } : prev,
    );
  }, []);

  const handlePdfFileRemove = useCallback(() => {
    setEditForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        detailPdfFile: undefined,
        detailPdfRemoved: prev.detailPdfFile ? false : true,
      };
    });
  }, []);

  const handleInlineSave = useCallback(async () => {
    if (!id || !editForm) return;

    const quill = quillRef.current;
    const html = quill ? quill.root.innerHTML : "";
    const deltaStr = quill ? JSON.stringify(quill.getContents()) : "";

    const payload = {
      title: editForm.title,
      start_date: toApiDateTime(editForm.start_date),
      end_date: toApiDateTime(editForm.end_date),
      location: editForm.location,
      organizer_name: editForm.organizer_name,
      description: html === "<p><br></p>" ? "" : html,
      description_delta: deltaStr,
      status: editForm.status || DEFAULT_STATUS,
      ...(editForm.file ? { file: editForm.file } : {}),
      ...(editForm.detailPdfFile
        ? { detailPdfFile: editForm.detailPdfFile }
        : {}),
      detailPdfRemoved: editForm.detailPdfRemoved,
    };

    try {
      await updateExh({ id, payload });
      await Swal.fire({
        title: "บันทึกการแก้ไขสำเร็จ",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
      setIsEditing(false);
      setEditForm(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(undefined);
      }
      quillRef.current = null;
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "กรุณาลองใหม่อีกครั้ง";
      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: message,
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  }, [id, editForm, imagePreview, updateExh]);

  // ── Delete handler ──
  const handleDelete = async () => {
    if (!id) return;
    const confirmResult = await Swal.fire({
      title: "ยืนยันการลบงานนี้หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      confirmButtonColor: "#ef4444",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!confirmResult.isConfirmed) return;

    try {
      await deleteExhibitionAsync(id);
      await Swal.fire({
        title: "ลบนิทรรศการเรียบร้อย",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
      navigate("/exhibitions");
    } catch {
      await Swal.fire({
        title: "ลบไม่สำเร็จ กรุณาลองใหม่",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  // ── Create mode submit ──
  const handleCreateSubmit = async (v: ExhibitionFormValues) => {
    if (!authUser?.user_id) {
      await Swal.fire({
        title: "ต้องเข้าสู่ระบบ",
        text: "กรุณาเข้าสู่ระบบก่อนสร้างนิทรรศการ",
        icon: "warning",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    const payload = {
      title: v.title,
      start_date: toApiDateTime(v.start_date),
      end_date: toApiDateTime(v.end_date),
      location: v.location,
      organizer_name: v.organizer_name,
      description: v.description,
      description_delta: v.description_delta,
      status: DEFAULT_STATUS,
      ...(v.file ? { file: v.file } : {}),
      ...(v.detailPdfFile ? { detailPdfFile: v.detailPdfFile } : {}),
    };

    try {
      const res = await createExh(payload);
      await Swal.fire({
        title: "เพิ่มนิทรรศการสำเร็จ",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
      navigate(`/exhibitions/${res.id}`);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "กรุณาลองใหม่อีกครั้ง";
      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: message,
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const hasAuthToken = useAuthStatus();

  const handlePanelBack = () => {
    if (isEditing) {
      handleCancelInlineEdit();
      return;
    }
    const historyIdx =
      typeof window !== "undefined" &&
      typeof window.history.state?.idx === "number"
        ? window.history.state.idx
        : null;

    if (historyIdx !== null && historyIdx > 0) {
      navigate(-1);
      return;
    }
    navigate("/exhibitions");
  };

  const isReadOnlyView = searchParams.get("view") === "true";

  // ── Action bar buttons for view mode ──
  const viewActionBar =
    hasAuthToken && !isReadOnlyView ? (
      <>
        <button
          type="button"
          className={cardStyles.toolBtn}
          onClick={handleStartEdit}
        >
          <FaEdit size={16} />
          แก้ไข
        </button>
        <button
          type="button"
          className={cardStyles.toolBtn}
          onClick={() => setShowSurveyModal(true)}
        >
          <FaClipboardList size={16} />
          จัดการแบบสอบถาม
        </button>
        {id && (
          <button
            type="button"
            className={cardStyles.toolBtn}
            onClick={() => navigate(`/exhibitions/${id}/certificate`)}
          >
            <FaCertificate size={16} />
            จัดการใบประกาศ
          </button>
        )}
        {id && (
          <button
            type="button"
            className={cardStyles.toolBtn}
            onClick={() => navigate(`/exhibitions/${id}/news`)}
          >
            <FaBullhorn size={16} />
            ประกาศข่าวสาร
          </button>
        )}
        <button
          type="button"
          className={`${cardStyles.toolBtn} ${cardStyles.toolBtnDanger}`}
          onClick={handleDelete}
        >
          <FiTrash2 size={16} />
          ลบ
        </button>
      </>
    ) : undefined;

  return (
    <div>
      {!isLoading && !isError && (
        <>
          <HeaderBar
            active="exhibition_unit"
            onLoginClick={() => navigate("/login")}
          />
          <div className={styles.container}>
            <div className={styles.title}>
              <div className={styles.titleLeft}>
                {!isInClient && (
                  <button onClick={handlePanelBack}>
                    <ArrowLeft size={24} />
                  </button>
                )}

                <h1>{pageTitle}</h1>
              </div>
            </div>
            <div>
              {mode === "create" ? (
                <>
                  <ExhibitionForm
                    ref={formRef}
                    mode="create"
                    exhibitionId={id}
                    initialValues={initialValues}
                    initialFileName={initialFileName}
                    initialDetailPdfName={initialDetailPdfName}
                    readOnly={false}
                    onSubmit={handleCreateSubmit}
                    preferDraft
                  />
                </>
              ) : data ? (
                <>
                  <ExhibitionDetailCard
                    title={data.title}
                    startISO={toISO(data.start_date)}
                    endISO={toISO(data.end_date)}
                    location={data.location}
                    organizer={data.organizer_name}
                    description={descriptionPlain}
                    descriptionHtml={descriptionHtml}
                    imageUrl={toFileUrl(data.picture_path || "")}
                    detailPdfUrl={data.detailPdfUrl}
                    status={
                      data.status
                        ? (STATUS_LABELS[data.status] ?? data.status)
                        : undefined
                    }
                    registerLink={
                      id ? `/register?exhibition_id=${id}` : undefined
                    }
                    isEditing={isEditing}
                    editForm={editForm ?? undefined}
                    imagePreview={imagePreview}
                    initialDetailPdfName={initialDetailPdfName}
                    quillContainerRef={quillContainerRef}
                    onFieldChange={handleFieldChange}
                    onFileChange={handleFileChange}
                    onPdfFileChange={handlePdfFileChange}
                    onPdfFileRemove={handlePdfFileRemove}
                    onSave={handleInlineSave}
                    onCancelEdit={handleCancelInlineEdit}
                    actionBar={viewActionBar}
                  />
                  {id && <UnitManageList mode={mode} embedded />}
                </>
              ) : null}
            </div>
          </div>
        </>
      )}
      {isError && <NotFound />}
      {showSurveyModal && id && (
        <SurveyManageModal
          exhibitionId={id}
          onClose={() => setShowSurveyModal(false)}
        />
      )}
    </div>
  );
}
