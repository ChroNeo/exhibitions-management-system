import type { ResultSetHeader } from "mysql2";
import { AppError } from "../errors.js";
import type { AddUnitPayload, UpdateUnitPayload } from "../models/unit_model.js";
import { safeQuery } from "../services/dbconn.js";

type UnitRow = {
      unit_id: number;
      exhibition_id: number;
      unit_name: string;
      unit_type: string;
      description: string | null;
      description_delta: string | null;
      poster_url: string | null;
      starts_at: string;
      ends_at: string;
};

export async function getUnitsByExhibitionId(exId: string | number): Promise<UnitRow[]> {
      if (!/^\d+$/.test(String(exId))) {
            throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
      }
      const rows = await safeQuery<UnitRow[]>(
            `
      SELECT
        *
      FROM v_units_by_exhibition u
      WHERE u.exhibition_id = ?
      ORDER BY u.starts_at, u.unit_id
    `,
            [exId],
      );
      return rows;
}

export async function getUnitsById(
      exId: string | number,
      unitId: string | number,
): Promise<UnitRow[]> {
      if (!/^\d+$/.test(String(exId)) || !/^\d+$/.test(String(unitId))) {
            throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
      }
      const rows = await safeQuery<UnitRow[]>(
            `
      SELECT
        u.unit_id,
        u.exhibition_id,
        u.unit_name,
        u.unit_type,
        u.description,
        u.poster_url,
        u.starts_at,
        u.ends_at
      FROM units u
      LEFT JOIN v_units_by_exhibition v
        ON v.unit_id = u.unit_id AND v.exhibition_id = u.exhibition_id
      WHERE u.exhibition_id = ? AND u.unit_id = ?
    `,
            [exId, unitId],
      );
      if (!rows.length) {
            throw new AppError("no units found for this exhibition", 404, "NOT_FOUND");
      }
      return rows;
}

export async function addUnit(payload: AddUnitPayload): Promise<any> {
      const result = await safeQuery<ResultSetHeader>(
            `INSERT INTO units
                  (exhibition_id, unit_name, unit_type, description, description_delta, poster_url, starts_at, ends_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                  payload.exhibition_id,
                  payload.unit_name,
                  payload.unit_type,
                  payload.description ?? null,
                  payload.description_delta ?? null,
                  payload.poster_url ?? null,
                  payload.starts_at ?? null,
                  payload.ends_at ?? null,
            ]
      );

      const rows = await safeQuery<UnitRow[]>(
            `
            SELECT
              u.unit_id,
              u.exhibition_id,
              u.unit_name,
              u.unit_type,
              u.description,
              u.description_delta,
              u.poster_url,
              u.starts_at,
              u.ends_at
            FROM units u
            LEFT JOIN v_units_by_exhibition v
              ON v.unit_id = u.unit_id AND v.exhibition_id = u.exhibition_id
            WHERE u.exhibition_id = ? AND u.unit_id = ?
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
      if (changes.description_delta !== undefined) {
            push("description_delta", changes.description_delta);
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

      const rows = await safeQuery<UnitRow[]>(
            `
            SELECT
              u.unit_id,
              u.exhibition_id,
              u.unit_name,
              u.unit_type,
              u.description,
              u.description_delta,
              u.poster_url,
              u.starts_at,
              u.ends_at
            FROM units u
            LEFT JOIN v_units_by_exhibition v
              ON v.unit_id = u.unit_id AND v.exhibition_id = u.exhibition_id
            WHERE u.exhibition_id = ? AND u.unit_id = ?
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
