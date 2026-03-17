import { ResultSetHeader } from "mysql2";
import { AppError } from "../errors.js";
import {
  AnnoucncementsPayloadType,
  UpdateAnnouncementPayloadType,
} from "../models/news.model.js";
import { safeQuery } from "../services/dbconn.js";

export async function getAnnouncementList(): Promise<any[]> {
  const rows = await safeQuery(`
  SELECT announcement_id, exhibition_id, topic, description, image_url, is_active, created_at, updated_at
  FROM exhibition_announcements
  WHERE is_active = 1 ORDER BY created_at DESC;
`);
  return rows;
}

export async function getAnnouncementListbyId(
  id: string | number,
): Promise<any> {
  if (!/^\d+$/.test(String(id))) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }
  const rows = await safeQuery(
    `
      SELECT announcement_id, exhibition_id, topic, description, image_url, is_active, created_at, updated_at
      FROM exhibition_announcements
      WHERE exhibition_id = ?
      AND is_active = 1
      ORDER BY created_at DESC;
    `,
    [id],
  );
  return rows;
}
export async function getAnnouncementById(id: string | number): Promise<any> {
  if (!/^\d+$/.test(String(id))) {
    throw new AppError("invalid announcement id", 400, "VALIDATION_ERROR");
  }
  const rows = await safeQuery(
    `SELECT * FROM exhibition_announcements WHERE announcement_id = ?;`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createAnnouncement(
  payload: AnnoucncementsPayloadType,
): Promise<ResultSetHeader> {
  const result = await safeQuery<ResultSetHeader>(
    `
      INSERT INTO exhibition_announcements
        (exhibition_id, topic, description, description_delta, image_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?);
    `,
    [
      payload.exhibition_id,
      payload.topic,
      payload.description,
      payload.description_delta ?? null,
      payload.image_url,
      payload.is_active,
    ],
  );
  return result;
}

// S5: Whitelist of allowed column names to prevent dynamic column injection
const ANNOUNCEMENT_UPDATABLE_FIELDS = new Set<
  keyof UpdateAnnouncementPayloadType
>([
  "exhibition_id",
  "topic",
  "description",
  "description_delta",
  "image_url",
  "is_active",
]);

export async function updateAnnouncement(
  id: string | number,
  payload: UpdateAnnouncementPayloadType,
): Promise<ResultSetHeader> {
  if (!/^\d+$/.test(String(id))) {
    throw new AppError("invalid announcement id", 400, "VALIDATION_ERROR");
  }
  const fields = (
    Object.keys(payload) as (keyof UpdateAnnouncementPayloadType)[]
  ).filter((f) => ANNOUNCEMENT_UPDATABLE_FIELDS.has(f));
  if (fields.length === 0) {
    throw new AppError("no fields to update", 400, "VALIDATION_ERROR");
  }
  const setClauses = fields.map((f) => `${f} = ?`).join(", ");
  const values = fields.map((f) => payload[f]);
  const result = await safeQuery<ResultSetHeader>(
    `UPDATE exhibition_announcements SET ${setClauses} WHERE announcement_id = ?;`,
    [...values, id],
  );
  if (result.affectedRows === 0) {
    throw new AppError("announcement not found", 404, "NOT_FOUND");
  }
  return result;
}

export async function deleteAnnouncement(
  id: string | number,
): Promise<ResultSetHeader> {
  if (!/^\d+$/.test(String(id))) {
    throw new AppError("invalid announcement id", 400, "VALIDATION_ERROR");
  }
  // Q3: Soft delete — set is_active = 0 instead of hard DELETE
  const result = await safeQuery<ResultSetHeader>(
    `UPDATE exhibition_announcements SET is_active = 0 WHERE announcement_id = ? AND is_active = 1;`,
    [id],
  );
  if (result.affectedRows === 0) {
    throw new AppError("announcement not found", 404, "NOT_FOUND");
  }
  return result;
}
