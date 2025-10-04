import { useNavigate, useParams } from "react-router-dom";
import type { Mode } from "../../types/mode";
import { useRef } from "react";

type UnitManageDetailProps = { mode?: Mode };
export default function UnitMangeDetail({
  mode = "view",
}: UnitManageDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement | null>(null);

  // hooks
  //   const { mutateAsync: deleteExhibitionAsync } = useDeleteExhibition();
  //   const shouldFetch = mode !== "create" && !!id;
  //   const { data, isLoading, isError } = useExhibition(id ?? "", {
  //     enabled: shouldFetch,
  //   });
  //   const { mutateAsync: createExh } = useCreateExhibition();
  //   const { mutateAsync: updateExh } = useUpdateExhibition();

  const title =
    mode === "create"
      ? "เพิ่มกิจกรรม"
      : mode === "edit"
      ? "แก้ไขกิจกรรม"
      : "รายละเอียดกิจกรรม";

  return (
    <div>

    </div>
  );
}
