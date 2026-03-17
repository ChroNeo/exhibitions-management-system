const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api/v1";

// FS1: Local type definition instead of cross-monorepo import from backend
export interface FeatureImage {
  image: string | null;
  picture_path: string | null;
  href: string;
  ref_id: number;
}

export interface ExhibitionSummary {
  exhibition_id: number;
  title: string;
  picture_path: string | null;
  status: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
}

export interface FeatureResponse {
  featureImages: FeatureImage[];
  exhibitions: ExhibitionSummary[];
}

export async function fetchFeature(): Promise<FeatureResponse> {
  const res = await fetch(`${BASE}/feature`);
  if (!res.ok) throw new Error("ดึงข้อมูล Feature ไม่สำเร็จ");
  return res.json();
}
