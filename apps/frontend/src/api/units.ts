import type { Unit, UnitApi } from "../types/units";
import { toFileUrl } from "../utils/url";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api/v1";

function mapToUnit(x: UnitApi): Unit {
      const type = x.unit_type === "booth" || x.unit_type === "activity" ? x.unit_type : "activity";
      const posterUrl = toFileUrl(x.poster_url);

      return {
            id: String(x.unit_id),
            exhibitionId: x.exhibition_id,
            code: x.unit_code,
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
