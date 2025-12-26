import type { ResultSetHeader } from "mysql2";
import { AppError } from "../errors.js";
import { safeQuery } from "../services/dbconn.js";
import { CreateOrganizerUserInput, OrganizerLoginRow } from "../models/auth_model.js";


export async function authenticateOrganizerUser(
  username: string,
  password: string
): Promise<OrganizerLoginRow> {
  const rows = await safeQuery<OrganizerLoginRow[]>(
    `SELECT 
       user_id, username, email, role
     FROM organizer_users
     WHERE username = ?
       AND password_hash = SHA2(?, 256)`,
    [username, password]
  );

  if (!rows.length) {
    throw new AppError("invalid username or password", 401, "INVALID_CREDENTIALS");
  }

  return rows[0];
}
export async function createOrganizerUser(
  input: CreateOrganizerUserInput
): Promise<OrganizerLoginRow> {
  const { username, password, email, role } = input;

  const result = await safeQuery<ResultSetHeader>(
    `INSERT INTO organizer_users (username, password_hash, email, role)
     VALUES (?, SHA2(?, 256), ?, ?)`,
    [username, password, email, role]
  );

  if (!result.insertId) {
    throw new AppError("failed to create user", 500, "DB_ERROR");
  }

  const rows = await safeQuery<OrganizerLoginRow[]>(
    `SELECT user_id, username, email, role
     FROM organizer_users
     WHERE user_id = ?`,
    [result.insertId]
  );

  if (!rows.length) {
    throw new AppError("failed to load user", 500, "DB_ERROR");
  }
  return rows[0];
}
