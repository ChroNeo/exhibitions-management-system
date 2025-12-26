import type { Unit, UnitApi, UnitCreatePayload, UnitUpdatePayload } from "../types/units";
import { toFileUrl } from "../utils/url";
import { ensureQuillDeltaString, extractPlainTextDescription } from "../utils/text";
import { loadAuth } from "../utils/authStorage";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api/v1";

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const auth = loadAuth();
  if (auth && auth.token) {
    return {
      Authorization: `${auth.tokenType} ${auth.token}`,
    };
  }
  return {};
}

function mapToUnit(x: UnitApi): Unit {
  const type = x.unit_type === "booth" || x.unit_type === "activity" ? x.unit_type : "activity";
  const posterPath = x.poster_url ?? undefined;
  const posterUrl = toFileUrl(posterPath);
  const detailPdfPath = x.detail_pdf_url ?? undefined;
  const detailPdfUrl = toFileUrl(detailPdfPath);
  const descriptionHtml = x.description ?? "";
  const rawDelta = x.description_delta ?? undefined;
  const descriptionDelta = ensureQuillDeltaString(rawDelta);
  const description = extractPlainTextDescription({
    html: descriptionHtml,
    delta: rawDelta,
  });

  const staffUserIdsRaw = Array.isArray(x.staff_user_ids) ? x.staff_user_ids : [];
  let staffUserIds = staffUserIdsRaw
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && Number.isInteger(id) && id > 0);
  if (!staffUserIds.length && typeof x.staff_user_id === "number") {
    staffUserIds = [x.staff_user_id];
  }

  const staffNamesRaw = Array.isArray(x.staff_names) ? x.staff_names : [];
  let staffNames = staffNamesRaw
    .map((name) => (typeof name === "string" ? name.trim() : ""))
    .filter((name) => name.length > 0);
  if (!staffNames.length && typeof x.staff_name === "string" && x.staff_name.trim()) {
    staffNames = [x.staff_name.trim()];
  }

  return {
    id: String(x.unit_id),
    exhibitionId: x.exhibition_id,
    name: x.unit_name,
    type,
    description: description || undefined,
    descriptionHtml: descriptionHtml || undefined,
    descriptionDelta,
    staffUserIds,
    staffNames,
    posterUrl: posterUrl || undefined,
    posterPath,
    detailPdfUrl: detailPdfUrl || undefined,
    detailPdfPath,
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
  const { posterFile, poster_url, detailPdfFile, detail_pdf_url, staff_user_ids, ...rest } = payload;

  if (posterFile || detailPdfFile) {
    const fd = new FormData();
    const appendString = (key: string, value: string | number | undefined) => {
      if (value === undefined || value === null) return;
      fd.append(key, String(value));
    };

    appendString("unit_name", rest.unit_name);
    appendString("unit_type", rest.unit_type);
    appendString("description", rest.description);
    appendString("description_delta", rest.description_delta);
    appendString("starts_at", rest.starts_at);
    appendString("ends_at", rest.ends_at);
    if (staff_user_ids !== undefined) {
      fd.append("staff_user_ids", JSON.stringify(staff_user_ids));
    }
    if (posterFile) {
      fd.append("poster_url", posterFile);
    } else if (poster_url !== undefined) {
      appendString("poster_url", poster_url);
    }
    if (detailPdfFile) {
      fd.append("detail_pdf_url", detailPdfFile);
    } else if (detail_pdf_url !== undefined) {
      appendString("detail_pdf_url", detail_pdf_url);
    }

    const res = await fetch(`${BASE}/exhibitions/${id}/units`, {
      method: "POST",
      headers: getAuthHeaders(),
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
  if (staff_user_ids !== undefined) jsonPayload.staff_user_ids = staff_user_ids;
  if (poster_url !== undefined) jsonPayload.poster_url = poster_url;
  if (detail_pdf_url !== undefined) jsonPayload.detail_pdf_url = detail_pdf_url;

  const res = await fetch(`${BASE}/exhibitions/${id}/units`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
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
  const { posterFile, poster_url, detailPdfFile, detail_pdf_url, staff_user_ids, ...rest } = payload;

  if (posterFile || detailPdfFile) {
    const fd = new FormData();
    const appendString = (key: string, value: unknown) => {
      if (value === undefined || value === null) return;
      fd.append(key, typeof value === "string" ? value : String(value));
    };

    Object.entries(rest).forEach(([key, value]) => {
      if (value === undefined) return;
      appendString(key, value);
    });
    if (staff_user_ids !== undefined) {
      fd.append("staff_user_ids", JSON.stringify(staff_user_ids));
    }
    if (posterFile) {
      fd.append("poster_url", posterFile);
    } else if (poster_url !== undefined) {
      appendString("poster_url", poster_url);
    }
    if (detailPdfFile) {
      fd.append("detail_pdf_url", detailPdfFile);
    } else if (detail_pdf_url !== undefined) {
      appendString("detail_pdf_url", detail_pdf_url);
    }

    const res = await fetch(`${BASE}/exhibitions/${exId}/units/${uId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
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
  if (staff_user_ids !== undefined) {
    jsonPayload.staff_user_ids = staff_user_ids;
  }
  if (poster_url !== undefined) {
    jsonPayload.poster_url = poster_url;
  }
  if (detail_pdf_url !== undefined) {
    jsonPayload.detail_pdf_url = detail_pdf_url;
  }

  const res = await fetch(`${BASE}/exhibitions/${exId}/units/${uId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
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
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("ลบกิจกรรมไม่สำเร็จ");
}
