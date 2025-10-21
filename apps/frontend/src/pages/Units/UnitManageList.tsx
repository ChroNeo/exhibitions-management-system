import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AddInline from "../../components/AddInline/AddInline";
import styles from "./UnitManageList.module.css";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import Panel from "../../components/Panel/Panel";
import UnitExhibitionCard, {
  type UnitCardItem,
} from "../../components/unit/UnitExhibitionCard";
import { useExhibition } from "../../hook/useExhibition";
import { useUnits } from "../../hook/useUnits";
import type { Mode } from "../../types/mode";
import { fmtDateRangeTH } from "../../utils/date";
import Swal from "sweetalert2";
import { useDeleteUnit } from "../../hook/useDeleteUnit";
import { useAuthStatus } from "../../hook/useAuthStatus";

type UnitManageListProps = { mode?: Mode };

function toDate(value: string | number | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatUnitDateRange(
  start: string | number | Date,
  end: string | number | Date
): string {
  const startDate = toDate(start);
  const endDate = toDate(end);

  if (!startDate || !endDate) return "";
  return fmtDateRangeTH(startDate.toISOString(), endDate.toISOString());
}

export default function UnitManageList({ mode = "view" }: UnitManageListProps) {
  const { id: exhibitionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStatus();
  const { mutateAsync: deleteUnit } = useDeleteUnit();
  const { data: exhibition } = useExhibition(exhibitionId ?? "", {
    enabled: !!exhibitionId,
  });

  const { data: unitList, isLoading, isError } = useUnits(exhibitionId);

  const items = useMemo<UnitCardItem[]>(() => {
    if (!unitList) return [];

    return unitList.map((unit) => {
      const dateText = formatUnitDateRange(unit.startsAt, unit.endsAt);
      return {
        id: unit.id,
        title: unit.name,
        description: unit.description ?? "",
        dateText,
        typeLabel: unit.type ? `ประเภท: ${unit.type}` : undefined,
        posterUrl: unit.posterUrl,
      } satisfies UnitCardItem;
    });
  }, [unitList]);

  const handleBack = () => navigate("/units");

  const handleSelect = (unitId: string) => {
    if (!exhibitionId) return;
    navigate(`/units/${exhibitionId}/unit/${unitId}`);
  };

  const handleEdit = (unitId: string) => {
    if (!exhibitionId) return;
    navigate(`/units/${exhibitionId}/unit/${unitId}/edit`);
  };
  const handleDelete = async (exhibitionId: string, unitId: string) => {
    const confirmResult = await Swal.fire({
      title: "ยืนยันการลบกิจกรรมนี้หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!confirmResult.isConfirmed) return;

    try {
      await deleteUnit({ exhibitionId, unitId });
      await Swal.fire({
        title: "ลบกิจกรรมสำเร็จ",
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

  const title = exhibition?.title
    ? `กิจกรรมใน ${exhibition.title}`
    : "จัดการกิจกรรม";
  const shouldShowActions = mode === "view" && isAuthenticated;

  const handleAdd = () => {
    if (!exhibitionId) return;
    navigate(`/units/${exhibitionId}/unit/new`);
  };

  return (
    <div>
      <HeaderBar active="unit" onLoginClick={() => navigate("/login")} />
      <div className="container">
        <Panel title={title} onBack={handleBack}>
          {isLoading && <div>กำลังโหลดกิจกรรม...</div>}
          {isError && <div>ไม่สามารถโหลดกิจกรรมได้</div>}

          {!isLoading && !isError && (
            <>
              {items.length === 0 ? (
                <div className={styles.empty}>ยังไม่มีกิจกรรม</div>
              ) : (
                <div className={styles.list}>
                  {items.map((item) => (
                    <UnitExhibitionCard
                      key={item.id}
                      item={item}
                      onSelect={handleSelect}
                      onDelete={
                        shouldShowActions && exhibitionId
                          ? (unitId) => {
                              void handleDelete(exhibitionId, unitId);
                            }
                          : undefined
                      }
                      onEdit={shouldShowActions ? handleEdit : undefined}
                    />
                  ))}
                </div>
              )}
              {shouldShowActions && (
                <AddInline
                  variant="floating"
                  label="เพิ่มกิจกรรม"
                  ariaLabel="เพิ่มกิจกรรม"
                  onClick={handleAdd}
                />
              )}
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
