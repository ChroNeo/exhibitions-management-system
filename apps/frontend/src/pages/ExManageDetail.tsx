import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader/PageHeader";
import { useExhibition } from "../hook/useExhibition";
import { useUpdateExhibition } from "../hook/useUpdateExhibition";
import { useCreateExhibition } from "../hook/userCreateExhibition";
import DetailActions from "../components/Detail/DetailActions";
import type { Mode } from "../types/mode";
import ExhibitionForm, {
  type ExhibitionFormValues,
} from "../components/exhibition/form/ExhibitionForm";
import type { ExhibitionApi } from "../types/exhibition";
import { toApiDateTime, toInputDateTime } from "../utils/date";
import { useDeleteExhibition } from "../hook/useDeleteExhibition";

const DEFAULT_CREATED_BY = 1;

type ExManageDetailProps = { mode?: Mode };

export default function ExManageDetail({ mode = "view" }: ExManageDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutateAsync: deleteExhibitionAsync, isPending: isDeleting } =
    useDeleteExhibition();

  const shouldFetch = mode !== "create" && !!id;
  const { data, isLoading, isError } = useExhibition(id, {
    enabled: shouldFetch,
  });
  const { mutateAsync: createExh, isPending: isCreating } =
    useCreateExhibition();
  const { mutateAsync: updateExh, isPending: isUpdating } =
    useUpdateExhibition();
  const isSaving = isCreating || isUpdating;

  const title =
    mode === "create"
      ? "เพิ่มนิทรรศการ"
      : mode === "edit"
      ? "แก้ไขนิทรรศการ"
      : "รายละเอียดนิทรรศการ";

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
  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("ยืนยันการลบงานนี้หรือไม่?")) return;
    try {
      await deleteExhibitionAsync(id);
      alert("ลบนิทรรศการเรียบร้อย");
      navigate("/exhibitions");
    } catch (error) {
      console.error("Failed to delete exhibition", error);
      alert("ลบไม่สำเร็จ กรุณาลองใหม่");
    }
  };
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

    if (mode === "create") {
      const res = await createExh({
        ...basePayload,
        created_by: DEFAULT_CREATED_BY,
        ...(file ? { file } : {}),
      });
      alert("เพิ่มนิทรรศการสำเร็จ");
      navigate(`/exhibitions/${res.id}`);
      return;
    }

    if (mode === "edit" && id) {
      await updateExh({
        id,
        payload: {
          ...basePayload,
          ...(file ? { file } : {}),
        },
      });
      alert("บันทึกการแก้ไขสำเร็จ");
      navigate(-1);
    }
  };

  return (
    <div>
      <PageHeader title={title} />

      {isLoading && <div>กำลังโหลด...</div>}
      {isError && <div>ไม่พบข้อมูลนิทรรศการ</div>}

      {!isLoading && !isError && (
        <>
          <ExhibitionForm
            mode={mode}
            initialValues={initialValues}
            initialFileName={initialFileName}
            readOnly={mode === "view"}
            onSubmit={handleSubmit}
          />

          {/* ปุ่มแก้ไข/ลบ */}
          <DetailActions
            show={mode === "view"}
            onEdit={() => id && navigate(`/exhibitions/${id}/edit`)}
            onDelete={handleDelete}
          />
        </>
      )}

      {isSaving && <div>กำลังบันทึก...</div>}
      {isDeleting && <div>กำลังลบ...</div>}
    </div>
  );
}









