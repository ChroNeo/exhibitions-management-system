import { safeQuery } from "../services/dbconn.js";

export type UserDropdownRow = {
  user_id: number;
  full_name: string;
};

export type UserRegistrationData = {
  user_id: number;
  line_user_id: string;
  full_name: string;
  email: string | null;
  exhibitions: number[];
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
    `,
  );
  return rows;
}

export async function getUserRegistrationsByLineId(
  lineUserId: string,
): Promise<UserRegistrationData | null> {
  if (!lineUserId?.trim()) {
    return null;
  }

  // First, get the user by LINE ID
  const [user] = await safeQuery<
    Array<{
      user_id: number;
      line_user_id: string;
      full_name: string;
      email: string | null;
    }>
  >(
    `SELECT user_id, line_user_id, full_name, email
     FROM normal_users
     WHERE line_user_id = ?
     LIMIT 1`,
    [lineUserId],
  );

  if (!user) {
    return null;
  }

  // Get all exhibition registrations for this user
  const registrations = await safeQuery<Array<{ exhibition_id: number }>>(
    `SELECT exhibition_id
     FROM registrations
     WHERE user_id = ?
     ORDER BY exhibition_id ASC`,
    [user.user_id],
  );

  return {
    user_id: user.user_id,
    line_user_id: user.line_user_id,
    full_name: user.full_name,
    email: user.email,
    exhibitions: registrations.map((r) => r.exhibition_id),
  };
}
