import type { ResultSetHeader } from "mysql2/promise";
import { safeQuery } from "../services/dbconn.js";

type LineUserRow = {
  user_id: number;
};

export type LineProfileRecord = {
  line_user_id: string;
  display_name: string;
  picture_url?: string | null;
};

export async function upsertLineUserProfile(profile: LineProfileRecord): Promise<number> {
  const normalizedName = profile.display_name?.trim() || "LINE User";
  const sanitizedUsername = buildUsername(normalizedName);
  const rows = await safeQuery<LineUserRow[]>(
    `
      SELECT user_id
      FROM normal_users
      WHERE line_user_id = ?
      LIMIT 1
    `,
    [profile.line_user_id]
  );

  if (rows.length) {
    const userId = rows[0].user_id;
    await safeQuery<ResultSetHeader>(
      `
        UPDATE normal_users
        SET full_name = ?,
            username = ?,
            picture_url = ?,
            last_synced_at = NOW()
        WHERE user_id = ?
      `,
      [normalizedName, sanitizedUsername, profile.picture_url ?? null, userId]
    );
    return userId;
  }

  const insertResult = await safeQuery<ResultSetHeader>(
    `
      INSERT INTO normal_users (
        line_user_id,
        full_name,
        username,
        picture_url,
        last_synced_at,
        role
      )
      VALUES (?, ?, ?, ?, NOW(), 'user')
    `,
    [profile.line_user_id, normalizedName, sanitizedUsername, profile.picture_url ?? null]
  );
  return insertResult.insertId;
}

export async function markLineUserUnfollowed(lineUserId: string): Promise<void> {
  await safeQuery<ResultSetHeader>(
    `
      UPDATE normal_users
      SET last_synced_at = NOW()
      WHERE line_user_id = ?
    `,
    [lineUserId]
  );
}

export type LineExhibitionSummaryRow = {
  exhibition_code: string;
  title: string;
  start_date: string;
  end_date: string;
  location: string | null;
  organizer_name: string;
};

export type LineExhibitionDetailRow = LineExhibitionSummaryRow & {
  description: string | null;
  status: string;
};

export async function getUpcomingExhibitionsForLine(
  limit: number = 5
): Promise<LineExhibitionSummaryRow[]> {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 10) : 3;
  const rows = await safeQuery<LineExhibitionSummaryRow[]>(
    `
      SELECT
        exhibition_code,
        title,
        start_date,
        end_date,
        location,
        organizer_name
      FROM exhibitions
      WHERE status IN ('published', 'ongoing')
      ORDER BY start_date ASC
      LIMIT ?
    `,
    [safeLimit]
  );
  return rows;
}

export async function findExhibitionForLine(
  exhibitionCode: string
): Promise<LineExhibitionDetailRow | null> {
  const normalized = exhibitionCode?.trim().toUpperCase();
  if (!normalized) {
    return null;
  }
  const rows = await safeQuery<LineExhibitionDetailRow[]>(
    `
      SELECT
        exhibition_code,
        title,
        description,
        start_date,
        end_date,
        location,
        organizer_name,
        status
      FROM exhibitions
      WHERE exhibition_code = ?
      LIMIT 1
    `,
    [normalized]
  );
  return rows.length ? rows[0] : null;
}

export async function findUserByLineId(lineUserId: string): Promise<{ userId: number; role: string } | null> {
  const rows = await safeQuery<{ user_id: number; role: string }[]>(
    `
      SELECT user_id, role
      FROM normal_users
      WHERE line_user_id = ?
      LIMIT 1
    `,
    [lineUserId]
  );

  if (rows.length) {
    return {
      userId: rows[0].user_id,
      role: rows[0].role
    };
  }
  return null;
}

export type ExhibitionWithUnitsRow = {
  exhibition_id: number;
  exhibition_code: string;
  exhibition_title: string;
  unit_id: number | null;
  unit_code: string | null;
  unit_name: string | null;
  unit_type: 'activity' | 'booth' | null;
  is_checked_in: number;
};

export async function getExhibitionsWithUnitsForUser(userId: number): Promise<ExhibitionWithUnitsRow[]> {
  const rows = await safeQuery<ExhibitionWithUnitsRow[]>(
    `
      SELECT
        exhibition_id,
        exhibition_code,
        exhibition_title,
        unit_id,
        unit_code,
        unit_name,
        unit_type,
        is_checked_in
      FROM v_user_exhibition_checkin_status
      WHERE user_id = ?
      ORDER BY exhibition_id, unit_id
    `,
    [userId]
  );
  return rows;
}

function buildUsername(displayName: string): string | null {
  const collapsed = displayName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]/g, "")
    .slice(0, 100)
    .toLowerCase();
  return collapsed || null;
}
