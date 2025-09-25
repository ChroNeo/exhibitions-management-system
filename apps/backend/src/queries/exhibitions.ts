import type { ResultSetHeader } from "mysql2";
import type { AddExhibitionPayload } from "../models/exhibition.js";
import { AppError } from "../errors.js";
import { safeQuery } from "../services/dbconn.js";

export async function getExhibitionsList(): Promise<any[]> {
  const rows = await safeQuery(`
    SELECT *
    FROM v_exhibitions
    ORDER BY start_date ASC
  `);
  return rows;
}

export async function getExhibitionById(id: string | number): Promise<any> {
  if (!/^\d+$/.test(String(id))) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }
  const rows = await safeQuery(
    `SELECT * FROM v_exhibitions WHERE exhibition_id = ?`,
    [id]
  );
  if (!rows.length) {
    throw new AppError("exhibition not found", 404, "NOT_FOUND");
  }
  return rows[0];
}

export async function addExhibitions(payload: AddExhibitionPayload): Promise<any> {
  // validate อย่างง่าย
  if (!payload.title || !payload.start_date || !payload.end_date || !payload.organizer_name) {
    throw new AppError("missing required fields", 400, "VALIDATION_ERROR");
  }

  const result = await safeQuery<ResultSetHeader>(
    `INSERT INTO exhibitions
      (title, description, start_date, end_date, location, organizer_name, picture_path, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.title,
      payload.description || null,
      payload.start_date,
      payload.end_date,
      payload.location || null,
      payload.organizer_name,
      payload.picture_path || null,
      payload.status || "draft",
      payload.created_by,
    ]
  );

  // คืน exhibition ที่เพิ่มไป โดยดึงจาก view v_exhibitions
  const [newExhibition] = await safeQuery<any[]>(
    `SELECT * FROM v_exhibitions WHERE exhibition_id = ?`,
    [result.insertId]
  );

  return newExhibition;
}
