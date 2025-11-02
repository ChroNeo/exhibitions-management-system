import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Swal from "sweetalert2";
import { useDeleteExhibition } from "../../hook/useDeleteExhibition";
import { useExhibition } from "../../hook/useExhibition";
import { useCreateExhibition } from "../../hook/useCreateExhibition";
import { useUpdateExhibition } from "../../hook/useUpdateExhibition";
import { useAuthUser } from "../../hook/useAuthUser";
import type { Exhibition } from "../../types/exhibition";
import { toApiDateTime, toInputDateTime } from "../../utils/date";
import type { ExhibitionFormValues } from "../../components/exhibition/form/ExhibitionForm";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import ExhibitionDetailCard from "../../components/exhibition/ExhibitionDetailCard";
import Panel from "../../components/Panel/Panel";
import DetailActions from "../../components/Detail/DetailActions";
import FormButtons from "../../components/Detail/FormButtons";
import ExhibitionForm from "../../components/exhibition/form/ExhibitionForm";
import type { Mode } from "../../types/mode";
import { toFileUrl } from "../../utils/url";
import NotFound from "../../components/NotFound";
import { useAuthStatus } from "../../hook/useAuthStatus";
import UnitManageList from "../Units/UnitManageList";
// descriptionPlain/Html already provided by Exhibition shape

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
  const formRef = useRef<HTMLFormElement | null>(null);

  // hooks
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
          console.log("loading");
        },
      });
    } else {
      Swal.close();
    }
  }, [isLoading]);
  const { mutateAsync: createExh } = useCreateExhibition();
  const { mutateAsync: updateExh } = useUpdateExhibition();
  const authUser = useAuthUser();
  const descriptionPlain = data?.description?.trim() || undefined;
  const descriptionHtml = data?.descriptionHtml;

  // Normalize various date input types to ISO string when needed
  const toISO = (value?: string | number | Date | null): string | undefined => {
    if (value === undefined || value === null) return undefined;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
  };

  const title =
    mode === "create"
      ? "เพิ่มนิทรรศการ"
      : mode === "edit"
      ? "แก้ไขนิทรรศการ"
      : "รายละเอียดนิทรรศการ";

  // ค่าตั้งต้นของแบบฟอร์ม
  const { initialValues, initialFileName } = useMemo(() => {
    if (!data || mode === "create") {
      return { initialValues: undefined, initialFileName: undefined };
    }
    const ex = data as Exhibition;
    const picturePath = ex.picture_path ?? "";
    const fileName = picturePath ? picturePath.split("/").pop() || picturePath : undefined;

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
    };
  }, [data, mode]);

  // ลบ
  const handleDelete = async () => {
    if (!id) return;

    const confirmResult = await Swal.fire({
      title: "ยืนยันการลบงานนี้หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
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
    } catch (error) {
      console.error("Failed to delete exhibition", error);
      await Swal.fire({
        title: "ลบไม่สำเร็จ กรุณาลองใหม่",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  // ยกเลิกแก้ไข
  const handleCancelEdit = () => {
    if (id) navigate(`/exhibitions/${id}`);
    else navigate(-1);
  };

  // submit ฟอร์ม
  const handleSubmit = async (v: ExhibitionFormValues) => {
    const basePayload = {
      title: v.title,
      start_date: toApiDateTime(v.start_date),
      end_date: toApiDateTime(v.end_date),
      location: v.location,
      organizer_name: v.organizer_name,
      description: v.description,
      description_delta: v.description_delta,
      status:
        mode === "create"
          ? DEFAULT_STATUS
          : v.status && v.status.length
          ? v.status
          : DEFAULT_STATUS,
    };
    const file = v.file ?? undefined;

    try {
      if (mode === "create") {
        if (!authUser?.user_id) {
          await Swal.fire({
            title: "ต้องเข้าสู่ระบบ",
            text: "กรุณาเข้าสู่ระบบก่อนสร้างนิทรรศการ",
            icon: "warning",
            confirmButtonText: "ตกลง",
          });
          return;
        }

        const res = await createExh({
          ...basePayload,
          created_by: authUser.user_id,
          ...(file ? { file } : {}),
        });
        await Swal.fire({
          title: "เพิ่มนิทรรศการสำเร็จ",
          icon: "success",
          confirmButtonText: "ตกลง",
        });
        navigate(`/exhibitions/${res.id}`);
        return;
      }

      if (mode === "edit" && id) {
        await updateExh({
          id,
          payload: { ...basePayload, ...(file ? { file } : {}) },
        });
        await Swal.fire({
          title: "บันทึกการแก้ไขสำเร็จ",
          icon: "success",
          confirmButtonText: "ตกลง",
        });
        navigate(`/exhibitions/${id}`);
      }
    } catch (error) {
      console.error("Failed to submit exhibition form", error);
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

  return (
    <div>
      {!isLoading && !isError && (
        <>
          <HeaderBar
            active="exhibition_unit"
            onLoginClick={() => navigate("/login")}
          />

          <div className="container">
            <Panel title={title} onBack={handlePanelBack}>
              {mode === "view" && data ? (
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
                    status={
                      data.status
                        ? STATUS_LABELS[data.status] ?? data.status
                        : undefined
                    }
                    registerLink={
                      id ? `/exhibitions/${id}/register` : undefined
                    }
                  />
                  <DetailActions
                    show={hasAuthToken}
                    onEdit={
                      hasAuthToken
                        ? () => {
                            if (id) navigate(`/exhibitions/${id}/edit`);
                          }
                        : undefined
                    }
                    onDelete={hasAuthToken ? handleDelete : undefined}
                  />
                </>
              ) : (
                <>
                  <ExhibitionForm
                    ref={formRef}
                    mode={mode}
                    exhibitionId={id}
                    initialValues={initialValues}
                    initialFileName={initialFileName}
                    readOnly={mode === "view"}
                    onSubmit={handleSubmit}
                    footer={mode === "edit" ? null : undefined}
                    preferDraft={mode !== "view"}
                  />
                  {mode === "edit" && (
                    <FormButtons
                      onConfirm={() => formRef.current?.requestSubmit()}
                      onCancel={handleCancelEdit}
                    />
                  )}
                </>
              )}
            </Panel>
            {id && mode !== "create" && <UnitManageList mode={mode} embedded />}
          </div>
        </>
      )}
      {isError && <NotFound />}
    </div>
  );
}
