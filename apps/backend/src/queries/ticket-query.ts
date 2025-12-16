import { safeQuery } from "../services/dbconn.js";

export type Ticket = {
  ticket_id: number;
  exhibition_id: number;
  user_id: number;
  ticket_code: string;
  ticket_type: "visitor" | "staff" | "vip";
  issued_at: Date;
  is_used: boolean;
  used_at: Date | null;
};

export type CreateTicketPayload = {
  exhibition_id: number;
  user_id: number;
  ticket_type: "visitor" | "staff" | "vip";
};

export type TicketWithDetails = {
  ticket_id: number;
  ticket_code: string;
  ticket_type: "visitor" | "staff" | "vip";
  exhibition_id: number;
  exhibition_code: string;
  exhibition_title: string;
  user_id: number;
  user_name: string;
  issued_at: Date;
  is_used: boolean;
  used_at: Date | null;
};

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const { exhibition_id, user_id, ticket_type } = payload;

  const result = await safeQuery<{ insertId: number }>(
    `INSERT INTO tickets (exhibition_id, user_id, ticket_type)
     VALUES (?, ?, ?)`,
    [exhibition_id, user_id, ticket_type]
  );

  const [ticket] = await safeQuery<Ticket[]>(
    `SELECT * FROM tickets WHERE ticket_id = ?`,
    [result.insertId]
  );

  return ticket;
}

export async function getTicketById(ticketId: number): Promise<TicketWithDetails | null> {
  const [ticket] = await safeQuery<TicketWithDetails[]>(
    `SELECT
      t.ticket_id,
      t.ticket_code,
      t.ticket_type,
      t.exhibition_id,
      e.exhibition_code,
      e.title as exhibition_title,
      t.user_id,
      u.full_name as user_name,
      t.issued_at,
      t.is_used,
      t.used_at
    FROM tickets t
    JOIN exhibitions e ON t.exhibition_id = e.exhibition_id
    JOIN normal_users u ON t.user_id = u.user_id
    WHERE t.ticket_id = ?`,
    [ticketId]
  );

  return ticket || null;
}

export async function getTicketsByExhibition(exhibitionId: number): Promise<TicketWithDetails[]> {
  const tickets = await safeQuery<TicketWithDetails[]>(
    `SELECT
      t.ticket_id,
      t.ticket_code,
      t.ticket_type,
      t.exhibition_id,
      e.exhibition_code,
      e.title as exhibition_title,
      t.user_id,
      u.full_name as user_name,
      t.issued_at,
      t.is_used,
      t.used_at
    FROM tickets t
    JOIN exhibitions e ON t.exhibition_id = e.exhibition_id
    JOIN normal_users u ON t.user_id = u.user_id
    WHERE t.exhibition_id = ?
    ORDER BY t.issued_at DESC`,
    [exhibitionId]
  );

  return tickets;
}

export async function getTicketsByUser(userId: number): Promise<TicketWithDetails[]> {
  const tickets = await safeQuery<TicketWithDetails[]>(
    `SELECT
      t.ticket_id,
      t.ticket_code,
      t.ticket_type,
      t.exhibition_id,
      e.exhibition_code,
      e.title as exhibition_title,
      t.user_id,
      u.full_name as user_name,
      t.issued_at,
      t.is_used,
      t.used_at
    FROM tickets t
    JOIN exhibitions e ON t.exhibition_id = e.exhibition_id
    JOIN normal_users u ON t.user_id = u.user_id
    WHERE t.user_id = ?
    ORDER BY t.issued_at DESC`,
    [userId]
  );

  return tickets;
}

export async function useTicket(ticketId: number): Promise<Ticket | null> {
  await safeQuery(
    `UPDATE tickets SET is_used = true, used_at = NOW() WHERE ticket_id = ? AND is_used = false`,
    [ticketId]
  );

  const [ticket] = await safeQuery<Ticket[]>(
    `SELECT * FROM tickets WHERE ticket_id = ?`,
    [ticketId]
  );

  return ticket || null;
}

export async function getTicketByCode(ticketCode: string): Promise<TicketWithDetails | null> {
  const [ticket] = await safeQuery<TicketWithDetails[]>(
    `SELECT
      t.ticket_id,
      t.ticket_code,
      t.ticket_type,
      t.exhibition_id,
      e.exhibition_code,
      e.title as exhibition_title,
      t.user_id,
      u.full_name as user_name,
      t.issued_at,
      t.is_used,
      t.used_at
    FROM tickets t
    JOIN exhibitions e ON t.exhibition_id = e.exhibition_id
    JOIN normal_users u ON t.user_id = u.user_id
    WHERE t.ticket_code = ?`,
    [ticketCode]
  );

  return ticket || null;
}

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
