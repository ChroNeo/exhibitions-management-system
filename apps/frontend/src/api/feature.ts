const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api/v1";

export type FeatureImage = {
  type: string;
  image: string;
  href: string;
  ref_id: number;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
};

export type Exhibition = {
  exhibition_id: number;
  title: string;
  picture_path: string;
  status: string;
  start_date: string;
  end_date: string;
  location: string;
};

export type FeatureResponse = {
  featureImages: FeatureImage[];
  exhibitions: Exhibition[];
};

export async function fetchFeature(): Promise<FeatureResponse> {
  const res = await fetch(`${BASE}/feature`);
  if (!res.ok) throw new Error("ดึงข้อมูล Feature ไม่สำเร็จ");
  return res.json();
}