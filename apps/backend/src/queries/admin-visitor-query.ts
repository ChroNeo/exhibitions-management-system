import type {
  CheckinRecord,
  Visitor,
  VisitorDetail,
  VisitorExhibition,
} from "../models/admin-visitor.model.js";
import { safeQuery } from "../services/dbconn.js";

export async function getVisitors(): Promise<Visitor[]> {
  return safeQuery<Visitor[]>(
    `SELECT
       u.user_id,
       u.full_name,
       u.email,
       u.phone,
       u.role,
       u.picture_url,
       COUNT(r.registration_id) AS registration_count
     FROM normal_users u
     LEFT JOIN registrations r ON u.user_id = r.user_id
     WHERE u.role NOT IN ('admin', 'organizer') OR u.role IS NULL
     GROUP BY u.user_id
     ORDER BY u.full_name ASC`,
  );
}

export async function getVisitorById(
  userId: number,
): Promise<VisitorDetail | null> {
  const rows = await safeQuery<VisitorDetail[]>(
    `SELECT
       user_id, full_name, email, phone, role, gender, birthdate, picture_url
     FROM normal_users
     WHERE user_id = ?`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function getVisitorExhibitions(
  userId: number,
): Promise<VisitorExhibition[]> {
  return safeQuery<VisitorExhibition[]>(
    `SELECT
       e.exhibition_id,
       e.exhibition_code,
       e.title,
       e.status,
       e.start_date,
       e.end_date,
       r.registered_at,
       (SELECT COUNT(*) FROM units un WHERE un.exhibition_id = e.exhibition_id) AS total_units,
       (SELECT COUNT(*) FROM units_checkins uc
        WHERE uc.exhibition_id = e.exhibition_id AND uc.user_id = r.user_id) AS checked_in_units
     FROM registrations r
     JOIN exhibitions e ON r.exhibition_id = e.exhibition_id
     WHERE r.user_id = ?
     ORDER BY r.registered_at DESC`,
    [userId],
  );
}

export async function getCheckins(
  userId: number,
  exhibitionId: number,
): Promise<CheckinRecord[]> {
  return safeQuery<CheckinRecord[]>(
    `SELECT
       uc.checkin_id,
       uc.unit_id,
       un.unit_name,
       un.unit_type,
       uc.checkin_at
     FROM units_checkins uc
     JOIN units un ON uc.unit_id = un.unit_id
     WHERE uc.user_id = ? AND uc.exhibition_id = ?
     ORDER BY uc.checkin_at DESC`,
    [userId, exhibitionId],
  );
}

export async function getExhibitionUnitsWithCheckin(
  userId: number,
  exhibitionId: number,
): Promise<(CheckinRecord & { checked_in: boolean })[]> {
  return safeQuery<(CheckinRecord & { checked_in: boolean })[]>(
    `SELECT
       un.unit_id,
       un.unit_name,
       un.unit_type,
       uc.checkin_id,
       uc.checkin_at,
       IF(uc.checkin_id IS NOT NULL, TRUE, FALSE) AS checked_in
     FROM units un
     LEFT JOIN units_checkins uc
       ON un.unit_id = uc.unit_id AND uc.user_id = ? AND uc.exhibition_id = ?
     WHERE un.exhibition_id = ?
     ORDER BY un.unit_name ASC`,
    [userId, exhibitionId, exhibitionId],
  );
}

export async function toggleCheckin(
  userId: number,
  exhibitionId: number,
  unitId: number,
): Promise<{ checked_in: boolean; checkin_id: number | null }> {
  // Check if already checked in
  const existing = await safeQuery<{ checkin_id: number }[]>(
    `SELECT checkin_id FROM units_checkins
     WHERE user_id = ? AND exhibition_id = ? AND unit_id = ?`,
    [userId, exhibitionId, unitId],
  );

  if (existing.length > 0) {
    // Remove check-in
    await safeQuery(`DELETE FROM units_checkins WHERE checkin_id = ?`, [
      existing[0].checkin_id,
    ]);
    return { checked_in: false, checkin_id: null };
  } else {
    // Add check-in
    const result = await safeQuery<{ insertId: number }>(
      `INSERT INTO units_checkins (user_id, exhibition_id, unit_id, checkin_at)
       VALUES (?, ?, ?, NOW())`,
      [userId, exhibitionId, unitId],
    );
    return { checked_in: true, checkin_id: (result as any).insertId };
  }
}
