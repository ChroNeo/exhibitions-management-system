import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import HeaderBar from "../../components/HeaderBar/HeaderBar";
import Panel from "../../components/Panel/Panel";
import UnitDetailCard from "../../components/unit/UnitDetailCard";
import { useUnit } from "../../hook/useUnit";
import type { Mode } from "../../types/mode";

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

export default function UnitManageDetail({
  mode = "view",
}: UnitManageDetailProps) {
  const { exhibitionId, unitId } = useParams<{
    exhibitionId: string;
    unitId?: string;
  }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useUnit(exhibitionId, unitId);

  const title = useMemo(() => {
    if (mode === "edit") return "แก้ไขกิจกรรม";
    if (mode === "create") return "เพิ่มกิจกรรม";
    return data?.name ? `รายละเอียดกิจกรรม: ${data.name}` : "รายละเอียดกิจกรรม";
  }, [mode, data?.name]);

  const description = data?.description?.trim() || undefined;
  const { dateText, timeText } = data
    ? buildDateTimeText(data.startsAt, data.endsAt)
    : { dateText: "-", timeText: undefined };

  const handleBack = () => {
    if (exhibitionId) navigate(`/units/${exhibitionId}`);
    else navigate("/units");
  };

  const handleEdit = () => {
    if (!exhibitionId || !unitId) return;
    navigate(`/units/${exhibitionId}/unit/${unitId}/edit`);
  };

  return (
    <div>
      <HeaderBar active="unit" onLoginClick={() => console.log("login")} />
      <div className="container">
        <Panel title={title} onBack={handleBack}>
          {mode !== "create" && isLoading && <div>กำลังโหลดกิจกรรม...</div>}
          {mode !== "create" && isError && (
            <div>ไม่สามารถโหลดข้อมูลกิจกรรมได้</div>
          )}

          {mode === "create" && (
            <div>
              <p>ฟอร์มสำหรับเพิ่มกิจกรรมจะถูกเพิ่มในภายหลัง</p>
            </div>
          )}

          {mode !== "create" && !isLoading && !isError && data && (
            <div className="cardWrap">
              <UnitDetailCard
                title={data.name}
                dateText={dateText}
                timeText={timeText}
                typeText={translateType(data.type)}
                staffText={data.staffUserId ? `ผู้ดูแล ID ${data.staffUserId}` : undefined}
                description={description}
                posterUrl={data.posterUrl}
                onEdit={mode === "view" ? handleEdit : undefined}
              />
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
