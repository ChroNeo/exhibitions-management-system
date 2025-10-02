import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import ExhibitionList from "../components/exhibition/ExhibitionList";
import AddInline from "../components/AddInline/AddInline";
import HeaderBar from "../components/HeaderBar/HeaderBar";

import { useExhibitions } from "../hook/useExhibitions";
import { useDeleteExhibition } from "../hook/useDeleteExhibition";
import type { Exhibition } from "../types/exhibition";
import Panel from "../components/Panel/Panel";
import Swal from "sweetalert2";

export default function ExhibitionPage() {
  const [query] = useState("");
  const navigate = useNavigate();

  const { data, isLoading, isError } = useExhibitions();
  const items: Exhibition[] = useMemo(() => data ?? [], [data]);
  const { mutateAsync: deleteExhibitionAsync, isPending: isDeleting } =
    useDeleteExhibition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) =>
      [x.title, x.description, x.location].some((t) =>
        (t || "").toLowerCase().includes(q)
      )
    );
  }, [items, query]);

  const handleAdd = () => {
    navigate("/exhibitions/new");
  };

  const handleSelect = (id: string) => {
    navigate(`/exhibitions/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/exhibitions/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
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
    } catch (error) {
      console.error("Failed to delete exhibition", error);
      await Swal.fire({
        title: "ลบไม่สำเร็จ กรุณาลองใหม่",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  return (
    <div>
      <HeaderBar
        active="exhibition"
        onLoginClick={() => console.log("login")}
      />
      <div className="container">
        <Panel title="หน้าจัดการงานนิทรรศการ">
          <div className="cardWrap">
            {isLoading && <div>Loading exhibitions...</div>}
            {isError && <div>Failed to load exhibitions</div>}
            {!isLoading && !isError && (
              <>
                <ExhibitionList
                  items={filtered}
                  onSelect={handleSelect}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
                <AddInline onClick={handleAdd} />
              </>
            )}
            {isDeleting && <div>กำลังลบ...</div>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// return (
//   <div>

//     <Panel title="จัดการนิทรรศการ">
//       <ExhibitionList
//         items={filtered}
//           onSelect={handleSelect}
//           onEdit={handleEdit}
//           onDelete={handleDelete}
//       />
//       {isDeleting && <div style={{ marginTop: 12 }}>กำลังลบ...</div>}
//     </Panel>
//   </div>
// );
