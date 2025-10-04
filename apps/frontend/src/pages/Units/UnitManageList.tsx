import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AddInline from "../../components/AddInline/AddInline";
import listStyles from "../../components/exhibition/ExhibitionList.module.css";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import Panel from "../../components/Panel/Panel";
import UnitExhibitionCard, { type UnitCardItem } from "../../components/unit/UnitExhibitionCard";
import { useExhibition } from "../../hook/useExhibition";
import { useUnits } from "../../hook/useUnits";
import type { Mode } from "../../types/mode";
import { fmtDateRangeTH } from "../../utils/date";

type UnitManageListProps = { mode?: Mode };

function toDate(value: string | number | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatUnitDateRange(start: string | number | Date, end: string | number | Date): string {
  const startDate = toDate(start);
  const endDate = toDate(end);

  if (!startDate || !endDate) return "";
  return fmtDateRangeTH(startDate.toISOString(), endDate.toISOString());
}

export default function UnitManageList({ mode = "view" }: UnitManageListProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: exhibition } = useExhibition(id ?? "", {
    enabled: !!id,
  });

  const {
    data: unitList,
    isLoading,
    isError,
  } = useUnits(id);

  const items = useMemo<UnitCardItem[]>(() => {
    if (!unitList) return [];

    return unitList.map((unit) => {
      const dateText = formatUnitDateRange(unit.startsAt, unit.endsAt);
      return {
        id: unit.id,
        title: unit.name,
        description: unit.description ?? "",
        dateText,
        codeLabel: unit.code ? `รหัสกิจกรรม: ${unit.code}` : undefined,
        typeLabel: unit.type ? `ประเภท: ${unit.type}` : undefined,
      } satisfies UnitCardItem;
    });
  }, [unitList]);

  const handleBack = () => navigate("/units");

  const handleSelect = (unitId: string) => {
    navigate(`/units/${unitId}`);
  };

  const handleEdit = (unitId: string) => {
    navigate(`/units/${unitId}/edit`);
  };

  const handleAdd = () => {
    if (!id) return;
    navigate(`/units/new?exhibitionId=${id}`);
  };

  const title = exhibition?.title ? `กิจกรรมใน ${exhibition.title}` : "จัดการกิจกรรม";
  const shouldShowActions = mode === "view";

  return (
    <div>
      <HeaderBar active="unit" onLoginClick={() => console.log("login")} />
      <div className="container">
        <Panel title={title} onBack={handleBack}>
          {isLoading && <div>กำลังโหลดกิจกรรม...</div>}
          {isError && <div>ไม่สามารถโหลดกิจกรรมได้</div>}

          {!isLoading && !isError && (
            <>
              {items.length === 0 ? (
                <div className={listStyles.empty}>ยังไม่มีกิจกรรม</div>
              ) : (
                <div className={listStyles.list}>
                  {items.map((item) => (
                    <UnitExhibitionCard
                      key={item.id}
                      item={item}
                      onSelect={handleSelect}
                      onEdit={shouldShowActions ? handleEdit : undefined}
                    />
                  ))}
                </div>
              )}
              {shouldShowActions && <AddInline onClick={handleAdd} />}
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
