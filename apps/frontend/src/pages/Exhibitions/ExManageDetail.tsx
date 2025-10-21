import { useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Swal from "sweetalert2";
import { useDeleteExhibition } from "../../hook/useDeleteExhibition";
import { useExhibition } from "../../hook/useExhibition";
import { useCreateExhibition } from "../../hook/useCreateExhibition";
import { useUpdateExhibition } from "../../hook/useUpdateExhibition";
import type { ExhibitionApi } from "../../types/exhibition";
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

const DEFAULT_CREATED_BY = 1;

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
    const api = data as unknown as ExhibitionApi;
    const picturePath = api.picture_path ?? "";
    const fileName = picturePath
      ? picturePath.split("/").pop() || picturePath
      : undefined;

    return {
      initialValues: {
        title: api.title ?? "",
        start_date: toInputDateTime(api.start_date),
        end_date: toInputDateTime(api.end_date),
        location: api.location ?? "",
        organizer_name: api.organizer_name ?? "",
        description: api.description ?? "",
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
    };
    const file = v.file ?? undefined;

    try {
      if (mode === "create") {
        const res = await createExh({
          ...basePayload,
          created_by: DEFAULT_CREATED_BY,
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

  return (
    <div>
      {!isLoading && !isError && (
        <>
          <HeaderBar
            active="exhibition"
            onLoginClick={() => navigate("/login")}
          />

          <div className="container">
            <Panel title={title} onBack={() => navigate(-1)}>
              {mode === "view" && data ? (
                <>
                  <ExhibitionDetailCard
                    title={data.title}
                    startText={new Date(data.start_date).toLocaleDateString(
                      "th-TH"
                    )}
                    endText={new Date(data.end_date).toLocaleDateString(
                      "th-TH"
                    )}
                    timeText={`${new Date(data.start_date).toLocaleTimeString(
                      "th-TH",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )} - ${new Date(data.end_date).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
                    location={data.location}
                    organizer={data.organizer_name}
                    description={data.description}
                    imageUrl={toFileUrl(data.picture_path || "")}
                  />
                  <DetailActions
                    show
                    onEdit={() => id && navigate(`/exhibitions/${id}/edit`)}
                    onDelete={handleDelete}
                  />
                </>
              ) : (
                <>
                  <ExhibitionForm
                    ref={formRef}
                    mode={mode}
                    initialValues={initialValues}
                    initialFileName={initialFileName}
                    readOnly={mode === "view"}
                    onSubmit={handleSubmit}
                    footer={mode === "edit" ? null : undefined}
                  />
                  {mode === "edit" && (
                    <FormButtons
                      onConfirm={() => formRef.current?.requestSubmit()}
                      onCancel={handleCancelEdit}
                    />
                  )}
                </>
              )}
              <div style={{ marginTop: 12 }}>
                <Link
                  to={`/exhibitions/${id}/register`}
                  className="btn success"
                >
                  ลงทะเบียน
                </Link>
              </div>
            </Panel>
          </div>
        </>
      )}
      {isError && <NotFound />}
    </div>
  );
}
