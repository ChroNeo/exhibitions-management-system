import { safeQuery } from "../services/dbconn.js";

export type UserTicketRow = {
  registration_id: number;
  exhibition_id: number;
  title: string;
  code: string;
  location: string | null;
  start_date: Date;
  end_date: Date;
  picture_path: string | null;
  status: string;
  registered_at: Date;
};

export type UserRegistrationData = {
  user_id: number;
  line_user_id: string;
  full_name: string;
  email: string | null;
  exhibitions: number[];
};

/**
 * Gets user registration data by LINE User ID.
 * Returns the user's internal ID and list of registered exhibition IDs.
 * @param lineUserId - The LINE User ID (sub from LIFF ID token)
 * @returns User data with exhibition registrations, or null if not found
 */
export async function getUserRegistrationsByLineId(
  lineUserId: string
): Promise<UserRegistrationData | null> {
  if (!lineUserId?.trim()) {
    return null;
  }

  // First, get the user by LINE ID
  const [user] = await safeQuery<Array<{
    user_id: number;
    line_user_id: string;
    full_name: string;
    email: string | null;
  }>>(
    `SELECT user_id, line_user_id, full_name, email
     FROM normal_users
     WHERE line_user_id = ?
     LIMIT 1`,
    [lineUserId]
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
    [user.user_id]
  );

  return {
    user_id: user.user_id,
    line_user_id: user.line_user_id,
    full_name: user.full_name,
    email: user.email,
    exhibitions: registrations.map((r) => r.exhibition_id),
  };

  
}
export async function getUserTickets(userId: number): Promise<UserTicketRow[]> {
  const rows = await safeQuery<UserTicketRow[]>(
    `SELECT 
       r.registration_id,
       e.exhibition_id,
       e.title,
       e.exhibition_code AS code,
       e.location,
       e.start_date,
       e.end_date,
       e.picture_path,
       e.status,
       r.registered_at
     FROM registrations r
     JOIN exhibitions e ON r.exhibition_id = e.exhibition_id
     WHERE r.user_id = ?
     ORDER BY e.start_date DESC`,
    [userId]
  );
  return rows;
}