import type { FeatureResponse } from "../../../backend/src/models/feature.model";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api/v1";

export type { FeatureResponse };

export async function fetchFeature(): Promise<FeatureResponse> {
  const res = await fetch(`${BASE}/feature`);
  if (!res.ok) throw new Error("ดึงข้อมูล Feature ไม่สำเร็จ");
  return res.json();
}