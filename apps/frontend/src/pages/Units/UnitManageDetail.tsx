import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import HeaderBar from "../../components/HeaderBar/HeaderBar";
import Panel from "../../components/Panel/Panel";
import UnitDetailCard from "../../components/unit/UnitDetailCard";
import UnitForm, { type UnitFormValues } from "../../components/unit/UnitForm";
import { useCreateUnit } from "../../hook/useCreateUnit";
import { useDeleteUnit } from "../../hook/useDeleteUnit";
import { useUnit } from "../../hook/useUnit";
import { useUpdateUnit } from "../../hook/useUpdateUnit";
import type { Mode } from "../../types/mode";
import type { UnitCreatePayload } from "../../types/units";
import { toApiDateTime, toInputDateTime } from "../../utils/date";
import Swal from "sweetalert2";

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

function buildDateTimeText(start: string | number | Date, end: string | number | Date) {
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

  const dateText = `วันที่ ${dateFmt.format(startDate)} – ${dateFmt.format(endDate)}`;
  const timeText = `เวลา ${timeFmt.format(startDate)} – ${timeFmt.format(endDate)} น.`;

  return { dateText, timeText } as const;
}

function toInputValue(value: string | number | Date) {
  const date = toDate(value);
  if (!date) return "";
  return toInputDateTime(date.toISOString());
}

export default function UnitManageDetail({ mode = "view" }: UnitManageDetailProps) {
  const { exhibitionId, unitId } = useParams<{
    exhibitionId: string;
    unitId?: string;
  }>();
  const navigate = useNavigate();

  const [formError, setFormError] = useState<string | null>(null);

  const createUnitMutation = useCreateUnit(exhibitionId);
  const updateUnitMutation = useUpdateUnit();
  const deleteUnitMutation = useDeleteUnit();

  const { data, isLoading, isError } = useUnit(exhibitionId, unitId);

  const isSubmitting =
    createUnitMutation.isPending ||
    updateUnitMutation.isPending ||
    deleteUnitMutation.isPending;

  const title = useMemo(() => {
    if (mode === "edit") return "แก้ไขกิจกรรม";
    if (mode === "create") return "เพิ่มกิจกรรม";
    return data?.name ? `รายละเอียดกิจกรรม: ${data.name}` : "รายละเอียดกิจกรรม";
  }, [mode, data?.name]);

  const description = data?.description?.trim() || undefined;
  const { dateText, timeText } = data
    ? buildDateTimeText(data.startsAt, data.endsAt)
    : { dateText: "-", timeText: undefined };
  const staffText = data?.staffName
    ? `ผู้ดูแล: ${data.staffName}`
    : data?.staffUserId
    ? `ผู้ดูแล ID ${data.staffUserId}`
    : undefined;

  const { initialFormValues, initialPosterName } = useMemo(() => {
    if (!data || mode === "create") {
      return { initialFormValues: undefined, initialPosterName: undefined };
    }

    const posterSource = data.posterPath ?? data.posterUrl ?? "";
    let posterName: string | undefined;
    if (posterSource) {
      const rawName = posterSource.split("/").pop()?.split("?")[0] ?? posterSource;
      try {
        posterName = decodeURIComponent(rawName);
      } catch {
        posterName = rawName;
      }
    }

    return {
      initialFormValues: {
        name: data.name,
        type: data.type,
        starts_at: toInputValue(data.startsAt),
        ends_at: toInputValue(data.endsAt),
        staff_user_id: data.staffUserId ? String(data.staffUserId) : "",
        description: data.description ?? "",
        file: undefined,
      } satisfies UnitFormValues,
      initialPosterName: posterName,
    };
  }, [data, mode]);

  const buildPayload = (values: UnitFormValues): UnitCreatePayload => {
    const trimmedName = values.name.trim();
    const startsAt = values.starts_at ? toApiDateTime(values.starts_at) : undefined;
    const endsAt = values.ends_at ? toApiDateTime(values.ends_at) : undefined;

    if (!trimmedName) {
      throw new Error("กรุณากรอกชื่อกิจกรรม");
    }

    if (!startsAt || !endsAt) {
      throw new Error("กรุณากรอกช่วงเวลาให้ครบถ้วน");
    }

    const staffId = Number(values.staff_user_id);

    const payload: UnitCreatePayload = {
      unit_name: trimmedName,
      unit_type: values.type,
      description: values.description.trim() ? values.description.trim() : undefined,
      staff_user_id:
        values.staff_user_id.trim() && !Number.isNaN(staffId) ? staffId : undefined,
      starts_at: startsAt,
      ends_at: endsAt,
    };

    if (values.file) {
      payload.posterFile = values.file;
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
      navigate(`/units/${exhibitionId}/unit/${unit.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถบันทึกกิจกรรมได้";
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
      navigate(`/units/${exhibitionId}/unit/${unitId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถบันทึกกิจกรรมได้";
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
    if (exhibitionId) navigate(`/units/${exhibitionId}`);
    else navigate("/units");
  };

  const handleEdit = () => {
    if (!exhibitionId || !unitId) return;
    navigate(`/units/${exhibitionId}/unit/${unitId}/edit`);
  };

  const handleDelete = async () => {
    if (!exhibitionId || !unitId) return;

    const confirmResult = await Swal.fire({
      title: "ยืนยันการลบกิจกรรมนี้หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
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
      navigate(`/units/${exhibitionId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ไม่สามารถลบกิจกรรมได้ กรุณาลองใหม่";
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

  return (
    <div>
      <HeaderBar active="unit" onLoginClick={() => navigate("/login")} />
      <div className="container">
        <Panel title={title} onBack={handleBack}>
          {isViewMode && isLoading && <div>กำลังโหลดกิจกรรม...</div>}
          {isViewMode && isError && <div>ไม่สามารถโหลดข้อมูลกิจกรรมได้</div>}

          {isViewMode && !isLoading && !isError && data && (
            <div className="cardWrap">
              <UnitDetailCard
                title={data.name}
                dateText={dateText}
                timeText={timeText}
                typeText={translateType(data.type)}
                staffText={staffText}
                description={description}
                posterUrl={data.posterUrl}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}

          {isCreateMode && (
            <>
              {formError && (
                <div style={{ color: "#b91c1c", marginBottom: "12px" }} role="alert">
                  {formError}
                </div>
              )}
              <UnitForm
                mode="create"
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
                    <div style={{ color: "#b91c1c", marginBottom: "12px" }} role="alert">
                      {formError}
                    </div>
                  )}
                  <UnitForm
                    key={unitId}
                    mode="edit"
                    initialValues={initialFormValues}
                    initialPosterName={initialPosterName}
                    onSubmit={handleEditSubmit}
                    isSubmitting={isSubmitting}
                  />
                </>
              )}
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
