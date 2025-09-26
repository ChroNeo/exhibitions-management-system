import type { ResultSetHeader } from "mysql2";
import type {
  AddExhibitionPayload,
  UpdateExhibitionPayload,
  ExhibitionStatus,
} from "../models/exhibition_model.js";
import { EXHIBITION_STATUSES } from "../models/exhibition_model.js";
import { AppError } from "../errors.js";
import { safeQuery } from "../services/dbconn.js";

export async function getExhibitionsList(): Promise<any[]> {
  const rows = await safeQuery(`
    SELECT *
    FROM v_exhibitions
    ORDER BY exhibition_code DESC 
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

export async function updateExhibition(
  id: string | number,
  payload: UpdateExhibitionPayload
): Promise<any> {
  if (!/^\d+$/.test(String(id))) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }

  const updates: string[] = [];
  const params: any[] = [];

  const requiredWhenProvided: Array<keyof UpdateExhibitionPayload> = [
    "title",
    "start_date",
    "end_date",
    "organizer_name",
  ];

  for (const field of requiredWhenProvided) {
    const value = payload[field];
    if (value === undefined) {
      continue;
    }
    if (typeof value !== "string" || !value) {
      throw new AppError(
        `${field} is required when provided`,
        400,
        "VALIDATION_ERROR"
      );
    }
  }

  const optionalFields: Array<keyof UpdateExhibitionPayload> = [
    "title",
    "description",
    "start_date",
    "end_date",
    "location",
    "organizer_name",
    "picture_path",
    "status",
  ];

  for (const field of optionalFields) {
    const value = payload[field];
    if (value === undefined) {
      continue;
    }

    if (field === "status") {
      if (value === undefined) {
        continue;
      }
      if (value === null) {
        throw new AppError("status cannot be null", 400, "VALIDATION_ERROR");
      }
      if (typeof value !== "string" || !value) {
        throw new AppError("invalid status value", 400, "VALIDATION_ERROR");
      }

      const normalised = value.toLowerCase() as ExhibitionStatus;
      if (!EXHIBITION_STATUSES.includes(normalised)) {
        throw new AppError("invalid status value", 400, "VALIDATION_ERROR");
      }
      updates.push("status = ?");
      params.push(normalised);
      continue;
    }

    const column = field;
    if (field === "description" || field === "location" || field === "picture_path") {
      updates.push(`${column} = ?`);
      params.push(value ?? null);
    } else {
      updates.push(`${column} = ?`);
      params.push(value);
    }
  }

  if (!updates.length) {
    throw new AppError("no fields to update", 400, "VALIDATION_ERROR");
  }

  const result = await safeQuery<ResultSetHeader>(
    `UPDATE exhibitions SET ${updates.join(", ")} WHERE exhibition_id = ?`,
    [...params, id]
  );

  if (!result.affectedRows) {
    throw new AppError("exhibition not found", 404, "NOT_FOUND");
  }

  const [updated] = await safeQuery<any[]>(
    `SELECT * FROM v_exhibitions WHERE exhibition_id = ?`,
    [id]
  );

  return updated;
}

export async function deleteExhibition(id: string | number): Promise<void> {
  if (!/^\d+$/.test(String(id))) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }

  const result = await safeQuery<ResultSetHeader>(
    `DELETE FROM exhibitions WHERE exhibition_id = ?`,
    [id]
  );

  if (!result.affectedRows) {
    throw new AppError("exhibition not found", 404, "NOT_FOUND");
  }
}
