import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";

import FloatingButton from "../../components/FloatingButton/FloatingButton";
import styles from "./UnitManageList.module.css";
import UnitExhibitionCard, {
  type UnitCardItem,
} from "../../components/unit/UnitExhibitionCard";
import { useExhibition, useDeleteUnit, useAuthStatus } from "../../hooks";
import { useUnits } from "./hooks";
import type { Mode } from "../../types/mode";
import { fmtDateRangeTH } from "../../utils/date";
import Swal from "sweetalert2";
import HeaderBar from "../../components/HeaderBar/HeaderBar";

type UnitManageListProps = { mode?: Mode; embedded?: boolean };

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

export default function UnitManageList({
  mode = "view",
  embedded = false,
}: UnitManageListProps) {
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

  const handleBack = () => {
    const historyIdx =
      typeof window !== "undefined" &&
      typeof window.history.state?.idx === "number"
        ? window.history.state.idx
        : null;

    if (historyIdx !== null && historyIdx > 0) {
      navigate(-1);
      return;
    }

    if (exhibitionId) {
      navigate(`/exhibitions/${exhibitionId}`);
    } else {
      navigate("/exhibitions");
    }
  };

  const handleSelect = (unitId: string) => {
    if (!exhibitionId) return;
    const selectedUnit = unitList?.find((unit) => unit.id === unitId);
    const pdfUrl = selectedUnit?.detailPdfUrl;

    if (pdfUrl) {
      if (typeof window !== "undefined") {
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }

    navigate(`/exhibitions/${exhibitionId}/unit/${unitId}`);
  };

  const handleEdit = (unitId: string) => {
    if (!exhibitionId) return;
    navigate(`/exhibitions/${exhibitionId}/unit/${unitId}/edit`);
  };
  const handleDelete = async (exhibitionId: string, unitId: string) => {
    const confirmResult = await Swal.fire({
      title: "ยืนยันการลบกิจกรรมนี้หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      confirmButtonColor: "#ef4444",
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
    navigate(`/exhibitions/${exhibitionId}/unit/new`);
  };

  const body = (
    <>
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
            <FloatingButton
              label="เพิ่มกิจกรรม"
              ariaLabel="เพิ่มกิจกรรม"
              onClick={handleAdd}
            />
          )}
        </>
      )}
    </>
  );

  if (embedded) {
    return (
      <div>
        <h2 className={styles.embeddedTitle}>{title}</h2>
        {body}
      </div>
    );
  }

  return (
    <div>
      <HeaderBar
        active="exhibition_unit"
        onLoginClick={() => navigate("/login")}
      />
      <div className="container">
        <section className={styles.section}>
          <div className={styles.header}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={handleBack}
              aria-label="ย้อนกลับ"
            >
              <FaArrowLeft />
            </button>
            <h2 className={styles.title}>{title}</h2>
            <span />
          </div>
          <div className={styles.body}>{body}</div>
        </section>
      </div>
    </div>
  );
}
