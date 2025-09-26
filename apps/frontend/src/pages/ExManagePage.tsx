import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useMediaQuery from "../hook/useMediaQuery";

import PageHeader from "../components/PageHeader/PageHeader";
import ExhibitionList from "../components/exhibition/ExhibitionList";
import AddInline from "../components/AddInline/AddInline";
import HeaderBar from "../components/Desktop_HeaderBar/HeaderBar";
import Panel from "../components/Panel/Panel";

import { useExhibitions } from "../hook/useExhibitions";
import { useDeleteExhibition } from "../hook/useDeleteExhibition";
import type { Exhibition } from "../types/exhibition";

export default function ExhibitionPage() {
  const isDesktop = useMediaQuery("(min-width: 900px)");
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
    if (!window.confirm("ยืนยันการลบงานนี้หรือไม่?")) return;
    try {
      await deleteExhibitionAsync(id);
      alert("ลบนิทรรศการเรียบร้อย");
    } catch (error) {
      console.error("Failed to delete exhibition", error);
      alert("ลบไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  if (!isDesktop) {
    return (
      <div>
        <PageHeader title="จัดการนิทรรศการ" />
        <div className="container">
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
        </div>
      </div>
    );
  }

  return (
    <div>
      <HeaderBar active="exhibition" onLoginClick={() => console.log("login")} />
      <Panel title="จัดการนิทรรศการ">
        <ExhibitionList
          items={filtered}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
        />
        {isDeleting && <div style={{ marginTop: 12 }}>กำลังลบ...</div>}
      </Panel>
    </div>
  );
}
