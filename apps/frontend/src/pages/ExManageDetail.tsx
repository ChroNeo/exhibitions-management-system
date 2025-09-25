import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/Mobile_Header/PageHeader";
import { useExhibition } from "../hook/useExhibition";
import { useUpdateExhibition } from "../hook/useUpdateExhibition";
import type { Mode } from "../types/mode";
import ExhibitionForm, {
  type ExhibitionFormValues,
} from "../components/exhibition/form/ExhibitionForm";
import type { ExhibitionApi } from "../types/exhibition";

type ExManageDetailProps = { mode?: Mode };

export default function ExManageDetail({ mode = "view" }: ExManageDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // เรียก hooks "เสมอ" ห้ามมี early return ก่อนหน้านี้
  const shouldFetch = mode !== "create" && !!id;
  const { data, isLoading, isError } = useExhibition(id, {
    enabled: shouldFetch,
  });
  const { mutateAsync: updateExh, isPending: isSaving } = useUpdateExhibition();

  // title ตามโหมด
  const title =
    mode === "create"
      ? "เพิ่มงานนิทรรศการ"
      : mode === "edit"
      ? "แก้ไขงานนิทรรศการ"
      : "รายละเอียดงานนิทรรศการ";

  // map API -> Form values (เรียก useMemo เสมอ ปลอดภัย)
  const initialValues: ExhibitionFormValues | undefined = useMemo(() => {
    if (!data || mode === "create") return undefined;
    const api = data as unknown as ExhibitionApi;
    return {
      title: api.title ?? "",
      start_date: api.start_date ?? "",
      end_date: api.end_date ?? "",
      location: api.location ?? "",
      organizer_name: api.organizer_name ?? "",
      description: api.description ?? "",
      file: undefined,
    };
  }, [data, mode]);

  // mock create 
  async function createExhibition(payload: ExhibitionFormValues) {
    console.log("CREATE payload:", payload);
    return { id: "new-id" };
  }

  const handleSubmit = async (v: ExhibitionFormValues) => {
    if (mode === "create") {
      const res = await createExhibition(v);
      alert("สร้างนิทรรศการสำเร็จ");
      navigate(`/exhibition/${res.id}`);
      return;
    }
    if (mode === "edit" && id) {
      await updateExh({ id, payload: v });
      alert("บันทึกการแก้ไขสำเร็จ");
      navigate(-1);
    }
  };

  // เรนเดอร์ตามสถานะ (ไม่มี early return ก่อนเรียก hooks)
  return (
    <div>
      <PageHeader title={title} />

      {isLoading && <div>กำลังโหลด...</div>}
      {isError && <div>โหลดข้อมูลไม่สำเร็จ</div>}

      {!isLoading && !isError && (
        <ExhibitionForm
          mode={mode}
          initialValues={initialValues}
          readOnly={mode === "view"}
          onSubmit={handleSubmit}
        />
      )}

      {isSaving && <div>กำลังบันทึก...</div>}
    </div>
  );
}
