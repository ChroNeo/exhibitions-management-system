import type { UserOption } from "../types/users";
import { fetchWithNgrokBypass } from "../utils/fetch";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api/v1";

export async function fetchUserOptions(role?: "staff" | "user"): Promise<UserOption[]> {
  const params = role ? `?role=${encodeURIComponent(role)}` : "";
  const res = await fetchWithNgrokBypass(`${BASE}/users${params}`);
  if (!res.ok) {
    throw new Error("ไม่สามารถโหลดรายชื่อผู้ใช้ได้");
  }
  const data = await res.json();

  if (!Array.isArray(data)) {
    return [];
  }

  const options = data
    .map((item: Partial<UserOption>) => ({
      value: Number(item?.value),
      label: typeof item?.label === "string" ? item.label.trim() : "",
    }))
    .filter((opt) => Number.isFinite(opt.value) && opt.label.length > 0);

  return options;
}
