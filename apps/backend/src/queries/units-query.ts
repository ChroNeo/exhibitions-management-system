import { AppError } from "../errors.js";
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
      if (!rows.length) {
            throw new AppError("no units found for this exhibition", 404, "NOT_FOUND");
      }
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