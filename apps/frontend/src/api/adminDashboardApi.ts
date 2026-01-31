import api from "./client";

export interface ExhibitionWithStats {
  exhibition_id: number;
  exhibition_code: string;
  title: string;
  status: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  organizer_name: string;
  picture_path: string | null;
  total_registrations: number;
}

export interface RegistrationRow {
  registration_id: number;
  user_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  registered_at: string | null;
}

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
