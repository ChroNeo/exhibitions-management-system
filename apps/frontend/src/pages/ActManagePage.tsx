import { useMemo, useState } from "react";
import HeaderBar from "../components/Desktop_HeaderBar/HeaderBar";
import ExhibitionList from "../components/exhibition/ExhibitionList";
import { useExhibitions } from "../hook/useExhibitions";
import type { Exhibition } from "../types/exhibition";


export default function ActManagePage() {
  const [query] = useState("");

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

  return (
    <div>
      <HeaderBar active="activity" onLoginClick={() => console.log("login")} />
      <div className="container">
        <div className="cardWrap">
          {isLoading && <div>Loading activities...</div>}
          {isError && <div>Failed to load activities</div>}
          {!isLoading && !isError && <ExhibitionList items={filtered} />}
        </div>
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
