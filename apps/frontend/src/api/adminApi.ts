import api from "./client";
import type {
  OrganizerUser,
  CreateUserPayload,
  ExhibitionWithStats,
  RegistrationRow,
  Visitor,
  VisitorDetail,
  VisitorExhibition,
  UnitCheckin,
} from "../types/admin";

// ── User Management ──

export async function getOrganizerUsers(): Promise<OrganizerUser[]> {
  const res = await api.get<OrganizerUser[]>("/admin/users");
  return res.data;
}

export async function createOrganizerUser(
  data: CreateUserPayload
): Promise<OrganizerUser> {
  const res = await api.post<OrganizerUser>("/admin/users", data);
  return res.data;
}

export async function updateUserRole(
  userId: number,
  role: "admin" | "organizer"
): Promise<OrganizerUser> {
  const res = await api.patch<OrganizerUser>(`/admin/users/${userId}/role`, {
    role,
  });
  return res.data;
}

export async function deleteOrganizerUserApi(userId: number): Promise<void> {
  await api.delete(`/admin/users/${userId}`);
}

// ── Dashboard ──

export async function getDashboardExhibitions(): Promise<ExhibitionWithStats[]> {
  const res = await api.get<ExhibitionWithStats[]>("/admin/dashboard/exhibitions");
  return res.data;
}

export async function getExhibitionRegistrations(
  exhibitionId: number
): Promise<RegistrationRow[]> {
  const res = await api.get<RegistrationRow[]>(
    `/admin/dashboard/exhibitions/${exhibitionId}/registrations`
  );
  return res.data;
}

// ── Visitor Management ──

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
