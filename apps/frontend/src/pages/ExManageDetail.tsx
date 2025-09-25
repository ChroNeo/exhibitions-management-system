import { useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader/PageHeader";
import { useExhibition } from "../hook/useExhibition";
import type { Mode } from "../types/mode";
import ExhibitionForm from "../components/exhibition/form/ExhibitionForm";
type ExManageDetailProps = {
  mode?: Mode; // ใส่โหมดที่ต้องการได้
};
export default function ExManageDetail({ mode }: ExManageDetailProps) {
  const { id } = useParams<{ id: string }>();
  let title = "จัดการงานนิทรรศการ";
  const shouldFetch = mode !== "create" && !!id;
  const { data, isLoading, isError } = useExhibition(id, {
    enabled: shouldFetch, // โหมด create จะไม่ fetch
  });
  console.log("mode :", mode);

  if (isLoading) return <div>กำลังโหลด...</div>;
  if (isError) return <div>โหลดข้อมูลไม่สำเร็จ</div>;

  if (mode === "create") {
    title = "เพิ่มงานนิทรรศการ";
  } else if (mode === "edit") {
    console.log(data);

    title = "แก้ไขงานนิทรรศการ";
  } else if (mode === "view") {
    console.log(data);
    title = "รายละเอียดงานนิทรรศการ";
  }

  return (
    <div>
      <PageHeader title={title} />
      <ExhibitionForm />
    </div>
  );
}
