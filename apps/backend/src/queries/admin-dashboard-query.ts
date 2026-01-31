import { safeQuery } from "../services/dbconn.js";
import type {
  ExhibitionWithStats,
  RegistrationRow,
} from "../models/admin-dashboard.model.js";

export async function getExhibitionsWithStats(): Promise<ExhibitionWithStats[]> {
  return safeQuery<ExhibitionWithStats[]>(
    `SELECT
       e.exhibition_id,
       e.exhibition_code,
       e.title,
       e.status,
       e.start_date,
       e.end_date,
       e.location,
       e.organizer_name,
       e.picture_path,
       COALESCE(v.total_registrations, 0) AS total_registrations
     FROM exhibitions e
     LEFT JOIN v_exhibition_with_registrations v
       ON e.exhibition_id = v.exhibition_id
     ORDER BY e.exhibition_id DESC`
  );
}

export async function getRegistrationsByExhibition(
  exhibitionId: number
): Promise<RegistrationRow[]> {
  return safeQuery<RegistrationRow[]>(
    `SELECT
       r.registration_id,
       u.full_name  AS user_name,
       u.email,
       u.phone,
       u.role,
       r.registered_at
     FROM registrations r
     JOIN normal_users u ON r.user_id = u.user_id
     WHERE r.exhibition_id = ?
     ORDER BY r.registered_at DESC`,
    [exhibitionId]
  );
}
