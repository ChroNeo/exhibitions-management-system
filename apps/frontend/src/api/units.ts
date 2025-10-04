import type { Unit, UnitApi, UnitCreatePayload, UnitUpdatePayload } from "../types/units";
import { toFileUrl } from "../utils/url";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api/v1";

function mapToUnit(x: UnitApi): Unit {
  const type = x.unit_type === "booth" || x.unit_type === "activity" ? x.unit_type : "activity";
  const posterUrl = toFileUrl(x.poster_url);

  return {
    id: String(x.unit_id),
    exhibitionId: x.exhibition_id,
    code: x.unit_code || undefined,
    name: x.unit_name,
    type,
    description: x.description ?? undefined,
    staffUserId: x.staff_user_id ?? undefined,
    posterUrl: posterUrl || undefined,
    startsAt: x.starts_at,
    endsAt: x.ends_at,
  };
}

export async function fetchUnits(exhibitionId: string | number): Promise<Unit[]> {
      const id = encodeURIComponent(String(exhibitionId));
      const res = await fetch(`${BASE}/exhibitions/${id}/units`);
      if (!res.ok) throw new Error("ดึงรายการกิจกรรมไม่สำเร็จ");
      const data = await res.json();
      return data.map(mapToUnit);
}

export async function fetchUnit(
  exhibitionId: string | number,
  unitId: string | number,
): Promise<Unit> {
  const exId = encodeURIComponent(String(exhibitionId));
  const uId = encodeURIComponent(String(unitId));
  const res = await fetch(`${BASE}/exhibitions/${exId}/units/${uId}`);
  if (!res.ok) throw new Error("ไม่พบข้อมูลกิจกรรม");
  const json = await res.json();
  const data: UnitApi | undefined = Array.isArray(json) ? json[0] : json;
  if (!data) throw new Error("ไม่พบข้อมูลกิจกรรม");
  return mapToUnit(data);
}

export async function createUnit(
  exhibitionId: string | number,
  payload: UnitCreatePayload,
): Promise<Unit> {
  const id = encodeURIComponent(String(exhibitionId));
  const res = await fetch(`${BASE}/exhibitions/${id}/units`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("สร้างกิจกรรมไม่สำเร็จ");
  const data: UnitApi = await res.json();
  return mapToUnit(data);
}

export async function updateUnit(
  exhibitionId: string | number,
  unitId: string | number,
  payload: UnitUpdatePayload,
): Promise<Unit> {
  const exId = encodeURIComponent(String(exhibitionId));
  const uId = encodeURIComponent(String(unitId));
  const res = await fetch(`${BASE}/exhibitions/${exId}/units/${uId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("อัปเดตกิจกรรมไม่สำเร็จ");
  const data: UnitApi = await res.json();
  return mapToUnit(data);
}

export async function deleteUnit(exhibitionId: string | number, unitId: string | number): Promise<void> {
  const exId = encodeURIComponent(String(exhibitionId));
  const uId = encodeURIComponent(String(unitId));
  const res = await fetch(`${BASE}/exhibitions/${exId}/units/${uId}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("ลบกิจกรรมไม่สำเร็จ");
}
