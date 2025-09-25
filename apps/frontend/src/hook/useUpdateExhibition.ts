// hook/useUpdateExhibition.ts
import { useMutation } from "@tanstack/react-query";

export type ExhibitionUpdatePayload = {
  title: string;
  start_date: string;
  end_date: string;
  location: string;
  organizer_name: string;
  description: string;
  file?: File | undefined;
};


async function updateExhibitionApi(id: string, body: ExhibitionUpdatePayload) {
  // ถ้ามีไฟล์ → ส่งแบบ FormData, ไม่มีไฟล์ → JSON ธรรมดา
  if (body.file) {
    const fd = new FormData();
    fd.append("title", body.title);
    fd.append("start_date", body.start_date);
    fd.append("end_date", body.end_date);
    fd.append("location", body.location);
    fd.append("organizer_name", body.organizer_name);
    fd.append("description", body.description);
    fd.append("file", body.file);

    const res = await fetch(`/api/exhibitions/${id}`, {
      method: "PUT",
      body: fd,
    });
    if (!res.ok) throw new Error("Update failed");
    return res.json();
  } else {
    const res = await fetch(`/api/exhibitions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: body.title,
        start_date: body.start_date,
        end_date: body.end_date,
        location: body.location,
        organizer_name: body.organizer_name,
        description: body.description,
      }),
    });
    if (!res.ok) throw new Error("Update failed");
    return res.json();
  }
}

export function useUpdateExhibition() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ExhibitionUpdatePayload }) =>
      updateExhibitionApi(id, payload),
  });
}
