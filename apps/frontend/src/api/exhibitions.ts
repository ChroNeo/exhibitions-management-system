// แปลงข้อมูลจาก API -> UI type
import type { Exhibition, ExhibitionApi } from "../types/exhibition";
import { fmtDateRangeTH } from "../utils/date";
const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api/v1";


function mapToExhibition(x: ExhibitionApi): Exhibition {
      return {
            id: String(x.exhibition_id),
            title: x.title,
            description: x.description ?? "",
            location: x.location ?? "",
            coverUrl: x.picture_path ?? "",      // ถ้ายังไม่มีรูป ใช้ field นี้แทนไปก่อน
            dateText: fmtDateRangeTH(x.start_date, x.end_date),
            isPinned: false,
      };
}

export async function fetchExhibitions(): Promise<Exhibition[]> {
      const res = await fetch(`${BASE}/exhibitions`);
      if (!res.ok) throw new Error("โหลดรายการนิทรรศการล้มเหลว");
      const data = await res.json();
      return data.map(mapToExhibition);
}

export async function fetchExhibitionById(id: string | number) {
      const res = await fetch(`${BASE}/exhibitions/${id}`);
      if (!res.ok) throw new Error("โหลดนิทรรศการไม่สำเร็จ");
      return res.json();
}

export async function createExhibition(payload: {
      title: string;
      description?: string;
      start_date: string; // "2025-11-01 09:00:00"
      end_date: string;   // "2025-11-05 18:00:00"
      location?: string;
      organizer_name: string;
      layout_url?: string;
}): Promise<Exhibition> {
      const res = await fetch(`${BASE}/exhibitions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("เพิ่มนิทรรศการล้มเหลว");
      const x = await res.json();
      return mapToExhibition(x);
}
