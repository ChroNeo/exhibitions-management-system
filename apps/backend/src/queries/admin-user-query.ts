import type { ResultSetHeader } from "mysql2";
import { AppError } from "../errors.js";
import { safeQuery } from "../services/dbconn.js";
import type { OrganizerUser } from "../models/admin-user.model.js";

export async function getAllOrganizerUsers(): Promise<OrganizerUser[]> {
  return safeQuery<OrganizerUser[]>(
    `SELECT user_id, username, email, role, last_login_at
     FROM organizer_users
     ORDER BY user_id ASC`
  );
}

export async function getOrganizerUserById(
  userId: number
): Promise<OrganizerUser> {
  const rows = await safeQuery<OrganizerUser[]>(
    `SELECT user_id, username, email, role, last_login_at
     FROM organizer_users
     WHERE user_id = ?`,
    [userId]
  );

  if (!rows.length) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  return rows[0];
}

export async function updateOrganizerUserRole(
  userId: number,
  role: "admin" | "organizer"
): Promise<OrganizerUser> {
  const result = await safeQuery<ResultSetHeader>(
    `UPDATE organizer_users SET role = ? WHERE user_id = ?`,
    [role, userId]
  );

  if (result.affectedRows === 0) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  return getOrganizerUserById(userId);
}

export async function deleteOrganizerUser(userId: number): Promise<void> {
  const result = await safeQuery<ResultSetHeader>(
    `DELETE FROM organizer_users WHERE user_id = ?`,
    [userId]
  );

  if (result.affectedRows === 0) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }
}
