import type { Unit, UnitApi, UnitCreatePayload, UnitUpdatePayload } from "../types/units";
import { toFileUrl } from "../utils/url";
import { ensureQuillDeltaString, extractPlainTextDescription } from "../utils/text";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api/v1";

function mapToUnit(x: UnitApi): Unit {
  const type = x.unit_type === "booth" || x.unit_type === "activity" ? x.unit_type : "activity";
  const posterPath = x.poster_url ?? undefined;
  const posterUrl = toFileUrl(posterPath);
  const descriptionHtml = x.description ?? "";
  const rawDelta = x.description_delta ?? undefined;
  const descriptionDelta = ensureQuillDeltaString(rawDelta);
  const description = extractPlainTextDescription({
    html: descriptionHtml,
    delta: rawDelta,
  });

  return {
    id: String(x.unit_id),
    exhibitionId: x.exhibition_id,
    name: x.unit_name,
    type,
    description: description || undefined,
    descriptionHtml: descriptionHtml || undefined,
    descriptionDelta,
    staffUserId: x.staff_user_id ?? undefined,
    staffName: x.staff_name ?? undefined,
    posterUrl: posterUrl || undefined,
    posterPath,
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
  const { posterFile, poster_url, ...rest } = payload;

  if (posterFile) {
    const fd = new FormData();
    const appendString = (key: string, value: string | number | undefined) => {
      if (value === undefined || value === null) return;
      fd.append(key, String(value));
    };

    appendString("unit_name", rest.unit_name);
    appendString("unit_type", rest.unit_type);
    appendString("description", rest.description);
    appendString("description_delta", rest.description_delta);
    appendString("staff_user_id", rest.staff_user_id);
    appendString("starts_at", rest.starts_at);
    appendString("ends_at", rest.ends_at);
    fd.append("poster_url", posterFile);

    const res = await fetch(`${BASE}/exhibitions/${id}/units`, {
      method: "POST",
      body: fd,
    });

    if (!res.ok) throw new Error("สร้างกิจกรรมไม่สำเร็จ");
    const data: UnitApi = await res.json();
    return mapToUnit(data);
  }

  const jsonPayload: Record<string, unknown> = {
    unit_name: rest.unit_name,
    unit_type: rest.unit_type,
    starts_at: rest.starts_at,
    ends_at: rest.ends_at,
  };

  if (rest.description !== undefined) jsonPayload.description = rest.description;
  if (rest.description_delta !== undefined) jsonPayload.description_delta = rest.description_delta;
  if (rest.staff_user_id !== undefined) jsonPayload.staff_user_id = rest.staff_user_id;
  if (poster_url !== undefined) jsonPayload.poster_url = poster_url;

  const res = await fetch(`${BASE}/exhibitions/${id}/units`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jsonPayload),
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
  const { posterFile, poster_url, ...rest } = payload;

  if (posterFile) {
    const fd = new FormData();
    const appendString = (key: string, value: unknown) => {
      if (value === undefined || value === null) return;
      fd.append(key, typeof value === "string" ? value : String(value));
    };

    Object.entries(rest).forEach(([key, value]) => {
      if (value === undefined) return;
      appendString(key, value);
    });
    fd.append("poster_url", posterFile);

    const res = await fetch(`${BASE}/exhibitions/${exId}/units/${uId}`, {
      method: "PUT",
      body: fd,
    });

    if (!res.ok) throw new Error("อัปเดตกิจกรรมไม่สำเร็จ");
    const data: UnitApi = await res.json();
    return mapToUnit(data);
  }

  const jsonPayload: Record<string, unknown> = {};
  Object.entries(rest).forEach(([key, value]) => {
    if (value === undefined) return;
    jsonPayload[key] = value;
  });
  if (poster_url !== undefined) {
    jsonPayload.poster_url = poster_url;
  }

  const res = await fetch(`${BASE}/exhibitions/${exId}/units/${uId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jsonPayload),
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
