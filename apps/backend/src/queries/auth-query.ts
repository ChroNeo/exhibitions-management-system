import type { ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt";
import { AppError } from "../errors.js";
import {
  CreateOrganizerUserInput,
  OrganizerLoginRow,
} from "../models/auth.model.js";
import { safeQuery } from "../services/dbconn.js";

const SALT_ROUNDS = 12;

export async function authenticateOrganizerUser(
  username: string,
  password: string,
): Promise<OrganizerLoginRow> {
  const rows = await safeQuery<(OrganizerLoginRow & { password_hash: string })[]>(
    `SELECT
       user_id, username, email, role, password_hash
     FROM organizer_users
     WHERE username = ?`,
    [username],
  );

  if (!rows.length) {
    throw new AppError(
      "invalid username or password",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  const match = await bcrypt.compare(password, rows[0].password_hash);
  if (!match) {
    throw new AppError(
      "invalid username or password",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  await safeQuery(
    `UPDATE organizer_users SET last_login_at = NOW() WHERE user_id = ?`,
    [rows[0].user_id],
  );

  const { password_hash: _, ...user } = rows[0];
  return user;
}
export async function createOrganizerUser(
  input: CreateOrganizerUserInput,
): Promise<OrganizerLoginRow> {
  const { username, password, email, role } = input;

  const result = await safeQuery<ResultSetHeader>(
    `INSERT INTO organizer_users (username, password_hash, email, role)
     VALUES (?, ?, ?, ?)`,
    [username, await bcrypt.hash(password, SALT_ROUNDS), email, role],
  );

  if (!result.insertId) {
    throw new AppError("failed to create user", 500, "DB_ERROR");
  }

  const rows = await safeQuery<OrganizerLoginRow[]>(
    `SELECT user_id, username, email, role
     FROM organizer_users
     WHERE user_id = ?`,
    [result.insertId],
  );

  if (!rows.length) {
    throw new AppError("failed to load user", 500, "DB_ERROR");
  }
  return rows[0];
}
