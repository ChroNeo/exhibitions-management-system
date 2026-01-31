import api from "./client";

export interface Visitor {
  user_id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  picture_url: string | null;
  registration_count: number;
}

export interface VisitorDetail {
  user_id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  gender: string | null;
  birthdate: string | null;
  picture_url: string | null;
}

export interface VisitorExhibition {
  exhibition_id: number;
  exhibition_code: string;
  title: string;
  status: string | null;
  start_date: string;
  end_date: string;
  registered_at: string | null;
  total_units: number;
  checked_in_units: number;
}

export interface UnitCheckin {
  unit_id: number;
  unit_name: string;
  unit_type: string;
  checkin_id: number | null;
  checkin_at: string | null;
  checked_in: boolean;
}

export async function getVisitors(): Promise<Visitor[]> {
  const res = await api.get<Visitor[]>("/admin/visitors");
  return res.data;
}

export async function getVisitorDetail(userId: number): Promise<VisitorDetail> {
  const res = await api.get<VisitorDetail>(`/admin/visitors/${userId}`);
  return res.data;
}

export async function getVisitorExhibitions(userId: number): Promise<VisitorExhibition[]> {
  const res = await api.get<VisitorExhibition[]>(`/admin/visitors/${userId}/exhibitions`);
  return res.data;
}

export async function getUnitCheckins(
  userId: number,
  exhibitionId: number
): Promise<UnitCheckin[]> {
  const res = await api.get<UnitCheckin[]>(
    `/admin/visitors/${userId}/exhibitions/${exhibitionId}/checkins`
  );
  return res.data;
}

export async function toggleCheckin(
  userId: number,
  exhibitionId: number,
  unitId: number
): Promise<{ checked_in: boolean; checkin_id: number | null }> {
  const res = await api.post(
    `/admin/visitors/${userId}/exhibitions/${exhibitionId}/checkins/toggle`,
    { unit_id: unitId }
  );
  return res.data;
}
