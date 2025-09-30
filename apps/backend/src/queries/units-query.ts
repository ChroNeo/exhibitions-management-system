import type { ResultSetHeader } from "mysql2";
import { AppError } from "../errors.js";
import type { AddUnitPayload, UpdateUnitPayload } from "../models/unit_model.js";
import { safeQuery } from "../services/dbconn.js";

export async function getUnitsByExhibitionId(
      exId: string | number
): Promise<any[]> {
      if (!/^\d+$/.test(String(exId))) {
            throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
      }
      const rows = await safeQuery(
            `SELECT * FROM v_units_by_exhibition WHERE exhibition_id = ? ORDER BY CAST(RIGHT(unit_code, 2) AS UNSIGNED);`,
            [exId]
      );
      return rows;
}

export async function getUnitsById(
      exId: string | number,
      unitId: string | number
): Promise<any[]> {
      if (!/^\d+$/.test(String(exId)) || !/^\d+$/.test(String(unitId))) {
            throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
      }
      const rows = await safeQuery(
            `
            SELECT *
            FROM v_units_by_exhibition
            WHERE exhibition_id = ? AND unit_id = ?
            `,
            [exId, unitId]
      );
      if (!rows.length) {
            throw new AppError("no units found for this exhibition", 404, "NOT_FOUND");
      }
      return rows;
}

export async function addUnit(payload: AddUnitPayload): Promise<any> {
      const result = await safeQuery<ResultSetHeader>(
            `INSERT INTO units
                  (exhibition_id, unit_name, unit_type, description, staff_user_id, poster_url, starts_at, ends_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                  payload.exhibition_id,
                  payload.unit_name,
                  payload.unit_type,
                  payload.description ?? null,
                  payload.staff_user_id ?? null,
                  payload.poster_url ?? null,
                  payload.starts_at ?? null,
                  payload.ends_at ?? null,
            ]
      );

      const rows = await safeQuery(
            `
            SELECT *
            FROM v_units_by_exhibition
            WHERE exhibition_id = ? AND unit_id = ?
            `,
            [payload.exhibition_id, result.insertId]
      );

      const unit = rows[0];
      if (!unit) {
            throw new AppError("failed to load created unit", 500, "DB_ERROR");
      }

      return unit;
}

export async function updateUnit(
      exId: string | number,
      unitId: string | number,
      changes: UpdateUnitPayload
): Promise<any> {
      if (!/^\d+$/.test(String(exId)) || !/^\d+$/.test(String(unitId))) {
            throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
      }
      if (!changes || !Object.keys(changes).length) {
            throw new AppError("no fields to update", 400, "VALIDATION_ERROR");
      }

      const assignments: string[] = [];
      const params: any[] = [];
      const push = (column: string, value: unknown) => {
            assignments.push(`${column} = ?`);
            params.push(value);
      };

      if (changes.unit_name !== undefined) {
            push("unit_name", changes.unit_name);
      }
      if (changes.unit_type !== undefined) {
            push("unit_type", changes.unit_type);
      }
      if (changes.description !== undefined) {
            push("description", changes.description);
      }
      if (changes.staff_user_id !== undefined) {
            push("staff_user_id", changes.staff_user_id);
      }
      if (changes.poster_url !== undefined) {
            push("poster_url", changes.poster_url);
      }
      if (changes.starts_at !== undefined) {
            push("starts_at", changes.starts_at);
      }
      if (changes.ends_at !== undefined) {
            push("ends_at", changes.ends_at);
      }

      if (!assignments.length) {
            throw new AppError("no fields to update", 400, "VALIDATION_ERROR");
      }

      const result = await safeQuery<ResultSetHeader>(
            `UPDATE units SET ${assignments.join(", ")} WHERE exhibition_id = ? AND unit_id = ?`,
            [...params, exId, unitId]
      );

      if (!result.affectedRows) {
            throw new AppError("unit not found for this exhibition", 404, "NOT_FOUND");
      }

      const rows = await safeQuery(
            `
            SELECT *
            FROM v_units_by_exhibition
            WHERE exhibition_id = ? AND unit_id = ?
            `,
            [exId, unitId]
      );

      const unit = rows[0];
      if (!unit) {
            throw new AppError("failed to load updated unit", 500, "DB_ERROR");
      }

      return unit;
}

export async function deleteUnit(
      exId: string | number,
      unitId: string | number
): Promise<void> {
      if (!/^\d+$/.test(String(exId)) || !/^\d+$/.test(String(unitId))) {
            throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
      }

      const result = await safeQuery<ResultSetHeader>(
            `DELETE FROM units WHERE exhibition_id = ? AND unit_id = ?`,
            [exId, unitId]
      );

      if (!result.affectedRows) {
            throw new AppError("unit not found for this exhibition", 404, "NOT_FOUND");
      }
}
