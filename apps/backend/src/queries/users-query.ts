import { safeQuery } from "../services/dbconn.js";

export type UserDropdownRow = {
  user_id: number;
  full_name: string;
};

/**
 * Fetch all users for dropdown selections, sorted by name and id for stability.
 */
export async function getListUsers(): Promise<UserDropdownRow[]> {
  const rows = await safeQuery<UserDropdownRow[]>(
    `
      SELECT
        user_id,
        full_name
      FROM normal_users
      ORDER BY full_name ASC, user_id ASC
    `
  );
  return rows;
}
