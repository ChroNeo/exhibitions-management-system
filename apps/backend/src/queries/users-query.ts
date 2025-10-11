import { safeQuery } from "../services/dbconn.js";

export type UserDropdownRow = {
  user_id: number;
  full_name: string;
};

/**
 * Fetch all users for dropdown selections, sorted by name and id for stability.
 */
export type UserRoleFilter = "staff" | "user";

export async function getListUsers(role?: UserRoleFilter): Promise<UserDropdownRow[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (role) {
    clauses.push("role = ?");
    params.push(role);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const rows = await safeQuery<UserDropdownRow[]>(
    `
      SELECT
        user_id,
        full_name
      FROM normal_users
      ${where}
      ORDER BY full_name ASC, user_id ASC
    `,
    params
  );
  return rows;
}
