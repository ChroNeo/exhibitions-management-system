import api from "./client";

export interface OrganizerUser {
  user_id: number;
  username: string;
  email: string | null;
  role: string;
  last_login_at: string | null;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  email?: string | null;
  role: "admin" | "organizer";
}

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
