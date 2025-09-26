import { useMemo, useState } from "react";
import HeaderBar from "../components/Desktop_HeaderBar/HeaderBar";
import ExhibitionList from "../components/exhibition/ExhibitionList";
import PageHeader from "../components/PageHeader/PageHeader";
import useMediaQuery from "../hook/useMediaQuery";
import { useExhibitions } from "../hook/useExhibitions";
import type { Exhibition } from "../types/exhibition";
import Panel from "../components/Panel/Panel";

export default function ActManagePage() {
  const isDesktop = useMediaQuery("(min-width: 900px)");
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
  if (!isDesktop) {
    return (
      <div>
        <PageHeader title="จัดการกิจกรรม" />
        <div className="container">
          <div className="cardWrap">
            {isLoading && <div>Loading exhibitions...</div>}
            {isError && <div>Failed to load exhibitions</div>}
            {!isLoading && !isError && (
              <>
                <ExhibitionList items={filtered} />
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <HeaderBar active="activity" />
      <Panel title="จัดการนิทรรศการ">
        <ExhibitionList items={filtered} />
      </Panel>
    </div>
  );
}
