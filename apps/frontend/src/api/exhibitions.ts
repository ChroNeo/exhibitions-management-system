// แปลงข้อมูล API -> UI type
import type { Exhibition, ExhibitionApi } from "../types/exhibition";
import { fmtDateRangeTH } from "../utils/date";
import { toFileUrl } from "../utils/url";
import { ensureQuillDeltaString, extractPlainTextDescription } from "../utils/text";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api/v1";

export type ExhibitionCreatePayload = {
  title: string;
  start_date: string;
  end_date: string;
  organizer_name: string;
  created_by: number;
  description?: string;
  description_delta?: string;
  location?: string;
  status?: string;
  file?: File;
};

export type ExhibitionUpdatePayload = {
  title?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  organizer_name?: string;
  description?: string;
  description_delta?: string;
  status?: string;
  file?: File;
};

function mapToExhibition(x: ExhibitionApi): Exhibition {
  const rawDelta = x.description_delta ?? undefined;
  const descriptionDelta = ensureQuillDeltaString(rawDelta);
  return {
    id: String(x.exhibition_id),
    title: x.title,
    status: x.status ?? "draft",
    description: extractPlainTextDescription({
      html: x.description ?? "",
      delta: rawDelta,
    }),
    descriptionHtml: x.description ?? "",
    descriptionDelta,
    location: x.location ?? "",
    coverUrl: toFileUrl(x.picture_path),      // เพื่อรองรับ field ที่ backend ส่งมาเพิ่มในอนาคต
    dateText: fmtDateRangeTH(x.start_date, x.end_date),
    isPinned: false,
    start_date: x.start_date,
    end_date: x.end_date,
    organizer_name: x.organizer_name ?? "",
    picture_path:  x.picture_path ?? "",
  };
}

export async function fetchExhibitions(): Promise<Exhibition[]> {
  const res = await fetch(`${BASE}/exhibitions`);
  if (!res.ok) throw new Error("ดึงรายการนิทรรศการไม่สำเร็จ");
  const data = await res.json();
  return data.map(mapToExhibition);
}

export async function fetchExhibitionById(id: string | number) {
  const res = await fetch(`${BASE}/exhibitions/${id}`);
  if (!res.ok) throw new Error("ไม่พบข้อมูลนิทรรศการ");
  return res.json();
}

export async function createExhibition(payload: ExhibitionCreatePayload): Promise<Exhibition> {
  const endpoint = `${BASE}/exhibitions`;
  const { file, ...rest } = payload;

  if (file) {
    const fd = new FormData();
    const appendString = (key: string, value: string | undefined) => {
      if (value === undefined) return;
      fd.append(key, value);
    };

    appendString("title", rest.title);
    appendString("start_date", rest.start_date);
    appendString("end_date", rest.end_date);
    appendString("location", rest.location);
    appendString("organizer_name", rest.organizer_name);
    appendString("description", rest.description);
    appendString("description_delta", rest.description_delta);
    appendString("status", rest.status);
    appendString("created_by", String(rest.created_by));
    fd.append("picture_path", file);

    const res = await fetch(endpoint, {
      method: "POST",
      body: fd,
    });

    if (!res.ok) throw new Error("สร้างนิทรรศการไม่สำเร็จ");
    const data = await res.json();
    return mapToExhibition(data);
  }

  const jsonPayload: Record<string, unknown> = {
    title: rest.title,
    start_date: rest.start_date,
    end_date: rest.end_date,
    organizer_name: rest.organizer_name,
    created_by: rest.created_by,
  };

  if (rest.location !== undefined) jsonPayload.location = rest.location;
  if (rest.description !== undefined) jsonPayload.description = rest.description;
  if (rest.description_delta !== undefined) {
    jsonPayload.description_delta = rest.description_delta;
  }
  if (rest.status !== undefined) jsonPayload.status = rest.status;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jsonPayload),
  });

  if (!res.ok) throw new Error("สร้างนิทรรศการไม่สำเร็จ");
  const data = await res.json();
  return mapToExhibition(data);
}

export async function deleteExhibition(id: string): Promise<void> {
  const res = await fetch(`${BASE}/exhibitions/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("ลบงานนิทรรศการไม่สำเร็จ");
}
export async function updateExhibitionApi(
  id: string,
  body: ExhibitionUpdatePayload,
): Promise<Exhibition> {
  const endpoint = `${BASE}/exhibitions/${id}`;
  const { file, ...rest } = body;

  if (file) {
    const fd = new FormData();
    const appendString = (key: string, value: string | undefined) => {
      if (value === undefined) return;
      fd.append(key, value);
    };

    appendString("title", rest.title);
    appendString("start_date", rest.start_date);
    appendString("end_date", rest.end_date);
    appendString("location", rest.location);
    appendString("organizer_name", rest.organizer_name);
    appendString("description", rest.description);
    appendString("description_delta", rest.description_delta);
    appendString("status", rest.status);
    fd.append("picture_path", file);

    const res = await fetch(endpoint, {
      method: "PUT",
      body: fd,
    });

    if (!res.ok) throw new Error("อัปเดตนิทรรศการไม่สำเร็จ");
    const data = await res.json();
    return mapToExhibition(data);
  }

  const jsonPayload: Record<string, unknown> = {};
  if (rest.title !== undefined) jsonPayload.title = rest.title;
  if (rest.start_date !== undefined) jsonPayload.start_date = rest.start_date;
  if (rest.end_date !== undefined) jsonPayload.end_date = rest.end_date;
  if (rest.location !== undefined) jsonPayload.location = rest.location;
  if (rest.organizer_name !== undefined) jsonPayload.organizer_name = rest.organizer_name;
  if (rest.description !== undefined) jsonPayload.description = rest.description;
  if (rest.description_delta !== undefined) {
    jsonPayload.description_delta = rest.description_delta;
  }
  if (rest.status !== undefined) jsonPayload.status = rest.status;

  if (!Object.keys(jsonPayload).length) {
    throw new Error("ไม่มีข้อมูลสำหรับอัปเดต");
  }

  const res = await fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jsonPayload),
  });

  if (!res.ok) throw new Error("อัปเดตนิทรรศการไม่สำเร็จ");
  const data = await res.json();
  return mapToExhibition(data);
}
