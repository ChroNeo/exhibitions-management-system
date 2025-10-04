import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import HeaderBar from "../../components/HeaderBar/HeaderBar";
import Panel from "../../components/Panel/Panel";
import { useUnit } from "../../hook/useUnit";
import type { Mode } from "../../types/mode";
import { fmtDateRangeTH } from "../../utils/date";

type UnitManageDetailProps = { mode?: Mode };

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

export default function UnitManageDetail({ mode = "view" }: UnitManageDetailProps) {
  const { exhibitionId, unitId } = useParams<{ exhibitionId: string; unitId?: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useUnit(exhibitionId, unitId);

  const title = useMemo(() => {
    if (mode === "edit") return "แก้ไขกิจกรรม";
    if (mode === "create") return "เพิ่มกิจกรรม";
    return data?.name ? `รายละเอียดกิจกรรม: ${data.name}` : "รายละเอียดกิจกรรม";
  }, [mode, data?.name]);

  const description = data?.description ?? "-";
  const timeRange = data ? formatUnitDateRange(data.startsAt, data.endsAt) : "";

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
          {mode !== "create" && isError && <div>ไม่สามารถโหลดข้อมูลกิจกรรมได้</div>}

          {mode === "create" && (
            <div>
              <p>ฟอร์มสำหรับเพิ่มกิจกรรมจะถูกเพิ่มในภายหลัง</p>
            </div>
          )}

          {mode !== "create" && !isLoading && !isError && data && (
            <div className="cardWrap">
              <div
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  maxWidth: "640px",
                  margin: "0 auto",
                }}
              >
                <h3 style={{ marginTop: 0 }}>{data.name}</h3>
                <p><strong>ประเภท:</strong> {data.type}</p>
                {data.code && <p><strong>รหัสกิจกรรม:</strong> {data.code}</p>}
                <p><strong>ช่วงเวลา:</strong> {timeRange}</p>
                {data.staffUserId && <p><strong>ผู้ดูแล:</strong> {data.staffUserId}</p>}
                <p><strong>รายละเอียด:</strong> {description}</p>

                <div style={{ marginTop: "16px" }}>
                  <button type="button" onClick={handleEdit}>
                    แก้ไขกิจกรรม
                  </button>
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
