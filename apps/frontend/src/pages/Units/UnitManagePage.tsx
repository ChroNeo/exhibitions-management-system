import { useMemo, useState } from "react";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import ExhibitionList from "../../components/exhibition/ExhibitionList";
import { useExhibitions } from "../../hook/useExhibitions";
import type { Exhibition } from "../../types/exhibition";
import styles from "./UnitManagePage.module.css";
import { useNavigate } from "react-router-dom";
export default function UnitManagePage() {
  const [query] = useState("");
  const navigate = useNavigate();
  const { data, isLoading, isError } = useExhibitions();
  const items: Exhibition[] = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) =>
      [x.title, x.description, x.location].some((t) =>
        (t || "").toLowerCase().includes(q)
      )
    );
  }, [items, query]);
  const handleSelect = (id: string) => {
    navigate(`/units/${id}`);
  };
  return (
    <div>
      <HeaderBar active="unit" onLoginClick={() => console.log("login")} />
      <div className="container">
        <section className={styles.panel}>
          <div className={styles.header}>
            <h2 className={styles.title}>จัดการกิจกรรม</h2>
          </div>
          <div className="cardWrap">
            {isLoading && <div>Loading activities...</div>}
            {isError && <div>Failed to load activities</div>}
            {!isLoading && !isError && (
              <ExhibitionList items={filtered} onSelect={handleSelect} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// return (
//   <div>
//     <HeaderBar active="activity" onLoginClick={() => console.log("login")} />
//     <Panel title="จัดการกิจกรรม">
//       <ExhibitionList items={filtered} />
//     </Panel>
//   </div>
// );
