import liff from "@line/liff";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";

import Swal from "sweetalert2";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import UnitDetailCard from "../../components/unit/UnitDetailCard";
import UnitForm, { type UnitFormValues } from "../../components/unit/UnitForm";
import { useAuthStatus, useDeleteUnit } from "../../hooks";
import type { Mode } from "../../types/mode";
import type { UnitCreatePayload } from "../../types/units";
import { toApiDateTime, toInputDateTime } from "../../utils/date";
import { useCreateUnit, useUnit, useUpdateUnit } from "./hooks";
import styles from "./UnitManageDetail.module.css";

type UnitManageDetailProps = { mode?: Mode };

const TYPE_LABEL: Record<string, string> = {
  booth: "บูธ",
  activity: "กิจกรรม",
};

function translateType(type: string | undefined) {
  if (!type) return undefined;
  return TYPE_LABEL[type] ?? type;
}

function toDate(value: string | number | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildDateTimeText(
  start: string | number | Date,
  end: string | number | Date,
) {
  const startDate = toDate(start);
  const endDate = toDate(end);

  if (!startDate || !endDate) {
    return { dateText: "-", timeText: undefined } as const;
  }

  const dateFmt = new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeFmt = new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateText = `วันที่ ${dateFmt.format(startDate)} – ${dateFmt.format(
    endDate,
  )}`;
  const timeText = `เวลา ${timeFmt.format(startDate)} – ${timeFmt.format(
    endDate,
  )} น.`;

  return { dateText, timeText } as const;
}

function toInputValue(value: string | number | Date) {
  const date = toDate(value);
  if (!date) return "";
  return toInputDateTime(date.toISOString());
}

export default function UnitManageDetail({
  mode = "view",
}: UnitManageDetailProps) {
  const { exhibitionId, unitId } = useParams<{
    exhibitionId: string;
    unitId?: string;
  }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStatus();
  const [isInClient, setIsInClient] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  const createUnitMutation = useCreateUnit(exhibitionId);
  const updateUnitMutation = useUpdateUnit();
  const deleteUnitMutation = useDeleteUnit();

  const { data, isLoading, isError } = useUnit(exhibitionId, unitId);

  useEffect(() => {
    setIsInClient(liff.isInClient());
  }, []);

  const isSubmitting =
    createUnitMutation.isPending ||
    updateUnitMutation.isPending ||
    deleteUnitMutation.isPending;

  const title = useMemo(() => {
    if (mode === "edit") return "แก้ไขกิจกรรม";
    if (mode === "create") return "เพิ่มกิจกรรม";
    return data?.name ? `รายละเอียดกิจกรรม: ${data.name}` : "รายละเอียดกิจกรรม";
  }, [mode, data?.name]);

  const descriptionPlain = data?.description?.trim() || undefined;
  const descriptionHtml = data?.descriptionHtml;
  const { dateText, timeText } = data
    ? buildDateTimeText(data.startsAt, data.endsAt)
    : { dateText: "-", timeText: undefined };
  const staffText =
    data && data.staffUserIds.length
      ? `ผู้ดูแล: ${
          data.staffNames.length
            ? data.staffNames.join(", ")
            : data.staffUserIds.map(String).join(", ")
        }`
      : undefined;

  const { initialFormValues, initialPosterUrl, initialDetailPdfName } =
    useMemo(() => {
      if (!data || mode === "create") {
        return {
          initialFormValues: undefined,
          initialPosterUrl: undefined,
          initialDetailPdfName: undefined,
        };
      }

      const detailPdfSource = data.detailPdfPath ?? data.detailPdfUrl ?? "";
      let detailPdfName: string | undefined;
      if (detailPdfSource) {
        const rawName =
          detailPdfSource.split("/").pop()?.split("?")[0] ?? detailPdfSource;
        try {
          detailPdfName = decodeURIComponent(rawName);
        } catch {
          detailPdfName = rawName;
        }
      }

      return {
        initialFormValues: {
          name: data.name,
          type: data.type,
          starts_at: toInputValue(data.startsAt),
          ends_at: toInputValue(data.endsAt),
          staff_user_ids: data.staffUserIds ?? [],
          description: data.descriptionHtml ?? "",
          description_delta: data.descriptionDelta ?? "",
          file: undefined,
          detailPdfFile: undefined,
          detailPdfRemoved: false,
          posterRemoved: false,
        } satisfies UnitFormValues,
        initialPosterUrl: data.posterUrl,
        initialDetailPdfName: detailPdfName,
      };
    }, [data, mode]);

  const buildPayload = (values: UnitFormValues): UnitCreatePayload => {
    const trimmedName = values.name.trim();
    const startsAt = values.starts_at
      ? toApiDateTime(values.starts_at)
      : undefined;
    const endsAt = values.ends_at ? toApiDateTime(values.ends_at) : undefined;

    if (!trimmedName) {
      throw new Error("กรุณากรอกชื่อกิจกรรม");
    }

    if (!startsAt || !endsAt) {
      throw new Error("กรุณากรอกช่วงเวลาให้ครบถ้วน");
    }

    const payload: UnitCreatePayload = {
      unit_name: trimmedName,
      unit_type: values.type,
      starts_at: startsAt,
      ends_at: endsAt,
    };

    if (values.staff_user_ids !== undefined) {
      const cleanedStaffIds = Array.from(
        new Set(
          (values.staff_user_ids ?? [])
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id) && id > 0),
        ),
      );
      payload.staff_user_ids = cleanedStaffIds;
    }

    const descriptionHtml = (values.description ?? "").trim();
    const descriptionDelta = (values.description_delta ?? "").trim();
    if (descriptionDelta.length) {
      payload.description_delta = descriptionDelta;
      payload.description = descriptionHtml || undefined;
    } else if (descriptionHtml.length) {
      payload.description = descriptionHtml;
    }

    if (values.file) {
      payload.posterFile = values.file;
    }
    if (values.posterRemoved && !values.file) {
      payload.poster_url = "";
    }
    if (values.detailPdfFile) {
      payload.detailPdfFile = values.detailPdfFile;
    }
    if (values.detailPdfRemoved && !values.detailPdfFile) {
      payload.detail_pdf_url = "";
    }

    return payload;
  };

  const handleCreateSubmit = async (values: UnitFormValues) => {
    if (!exhibitionId) return;
    setFormError(null);

    try {
      const payload = buildPayload(values);
      const unit = await createUnitMutation.mutateAsync(payload);
      await Swal.fire({
        title: "เพิ่มกิจกรรมสำเร็จ",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
      navigate(`/exhibitions/${exhibitionId}/unit/${unit.id}`, {
        replace: true,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ไม่สามารถบันทึกกิจกรรมได้";
      setFormError(message);
      await Swal.fire({
        title: "เพิ่มกิจกรรมไม่สำเร็จ",
        text: message,
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const handleEditSubmit = async (values: UnitFormValues) => {
    if (!exhibitionId || !unitId) return;
    setFormError(null);

    try {
      const payload = buildPayload(values);
      await updateUnitMutation.mutateAsync({ exhibitionId, unitId, payload });
      await Swal.fire({
        title: "บันทึกกิจกรรมสำเร็จ",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
      navigate(`/exhibitions/${exhibitionId}/unit/${unitId}`, {
        replace: true,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ไม่สามารถบันทึกกิจกรรมได้";
      setFormError(message);
      await Swal.fire({
        title: "บันทึกไม่สำเร็จ",
        text: message,
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const handleBack = () => {
    const canGoBack =
      typeof window !== "undefined" &&
      typeof window.history.state?.idx === "number" &&
      window.history.state.idx > 0;

    if (canGoBack) {
      navigate(-1);
      return;
    }

    if (exhibitionId) {
      navigate(`/exhibitions/${exhibitionId}`);
    } else {
      navigate("/exhibitions");
    }
  };

  const handleEdit = () => {
    if (!exhibitionId || !unitId) return;
    navigate(`/exhibitions/${exhibitionId}/unit/${unitId}/edit`);
  };

  const handleDelete = async () => {
    if (!exhibitionId || !unitId) return;

    const confirmResult = await Swal.fire({
      title: "ยืนยันการลบกิจกรรมนี้หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      confirmButtonColor: "#ef4444",
      cancelButtonText: "ยกเลิก",
      focusCancel: true,
      reverseButtons: true,
    });

    if (!confirmResult.isConfirmed) return;

    try {
      await deleteUnitMutation.mutateAsync({ exhibitionId, unitId });
      await Swal.fire({
        title: "ลบกิจกรรมเรียบร้อย",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
      navigate(`/exhibitions/${exhibitionId}`, { replace: true });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "ไม่สามารถลบกิจกรรมได้ กรุณาลองใหม่";
      setFormError(message);
      await Swal.fire({
        title: "ลบกิจกรรมไม่สำเร็จ",
        text: message,
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";

  const viewActionBar = isAuthenticated ? (
    <>
      <button type="button" className="toolBtn" onClick={handleEdit}>
        <FaEdit size={16} />
        แก้ไข
      </button>
      <button
        type="button"
        className="toolBtn toolBtnDanger"
        onClick={handleDelete}
      >
        <FiTrash2 size={16} />
        ลบ
      </button>
    </>
  ) : undefined;

  return (
    <div>
      <HeaderBar
        active="exhibition_unit"
        onLoginClick={() => navigate("/login")}
      />
      <div className={styles.container}>
        <div className={styles.title}>
          <div className={styles.titleLeft}>
            {!isInClient && (
              <button onClick={handleBack}>
                <ArrowLeft size={24} />
              </button>
            )}
            <h1>{title}</h1>
          </div>
        </div>

        <div>
          {isViewMode && isLoading && <div>กำลังโหลดกิจกรรม...</div>}
          {isViewMode && isError && <div>ไม่สามารถโหลดข้อมูลกิจกรรมได้</div>}

          {isViewMode && !isLoading && !isError && data && (
            <UnitDetailCard
              title={data.name}
              dateText={dateText}
              timeText={timeText}
              typeText={translateType(data.type)}
              staffText={staffText}
              description={descriptionPlain}
              descriptionHtml={descriptionHtml}
              posterUrl={data.posterUrl}
              detailPdfUrl={data.detailPdfUrl}
              actionBar={viewActionBar}
            />
          )}

          {isCreateMode && (
            <>
              {formError && (
                <div
                  style={{ color: "#b91c1c", marginBottom: "12px" }}
                  role="alert"
                >
                  {formError}
                </div>
              )}
              <UnitForm
                mode="create"
                exhibitionId={exhibitionId}
                onSubmit={handleCreateSubmit}
                isSubmitting={isSubmitting}
              />
            </>
          )}

          {isEditMode && (
            <>
              {isLoading && <div>กำลังโหลดกิจกรรม...</div>}
              {isError && <div>ไม่สามารถโหลดข้อมูลกิจกรรมได้</div>}
              {!isLoading && !isError && data && initialFormValues && (
                <>
                  {formError && (
                    <div
                      style={{ color: "#b91c1c", marginBottom: "12px" }}
                      role="alert"
                    >
                      {formError}
                    </div>
                  )}
                  <UnitForm
                    key={unitId}
                    mode="edit"
                    exhibitionId={exhibitionId}
                    unitId={unitId}
                    initialValues={initialFormValues}
                    initialPosterUrl={initialPosterUrl}
                    initialDetailPdfName={initialDetailPdfName}
                    onSubmit={handleEditSubmit}
                    isSubmitting={isSubmitting}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
