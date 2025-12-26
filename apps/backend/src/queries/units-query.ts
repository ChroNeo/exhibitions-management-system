import type { ResultSetHeader } from "mysql2";
import { AppError } from "../errors.js";
import type { AddUnitPayload, UnitRowBase, UnitRowWithStaff, UnitStaffRow, UpdateUnitPayload } from "../models/unit_model.js";
import { safeQuery } from "../services/dbconn.js";

const UNIT_FIELDS = `
    u.unit_id,
    u.exhibition_id,
    u.unit_name,
    u.unit_type,
    u.description,
    u.description_delta,
    u.poster_url,
    u.detail_pdf_url,
    u.starts_at,
    u.ends_at
  `;

function normaliseStaffIds(staffIds?: number[] | null): number[] | undefined {
  if (staffIds === undefined) {
    return undefined;
  }
  const list = Array.isArray(staffIds) ? staffIds : [];
  const cleaned = list
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && Number.isInteger(id) && id > 0);
  return Array.from(new Set(cleaned));
}

async function replaceUnitStaffs(unitId: number, staffIds: number[]): Promise<void> {
  await safeQuery<ResultSetHeader>(`DELETE FROM unit_staffs WHERE unit_id = ?`, [unitId]);
  if (!staffIds.length) {
    return;
  }
  const values = staffIds.map(() => "(?, ?)").join(", ");
  const params: number[] = [];
  staffIds.forEach((id) => {
    params.push(unitId, id);
  });
  await safeQuery<ResultSetHeader>(
    `INSERT INTO unit_staffs (unit_id, staff_user_id) VALUES ${values}`,
    params
  );
}

async function attachStaff(rows: UnitRowBase[]): Promise<UnitRowWithStaff[]> {
  if (!rows.length) {
    return [];
  }
  const unitIds = rows.map((row) => row.unit_id);
  const placeholders = unitIds.map(() => "?").join(", ");
  const staffRows = await safeQuery<UnitStaffRow[]>(
    `
      SELECT
        us.unit_id,
        us.staff_user_id,
        nu.full_name
      FROM unit_staffs us
      LEFT JOIN normal_users nu
        ON nu.user_id = us.staff_user_id
      WHERE us.unit_id IN (${placeholders})
      ORDER BY
        nu.full_name IS NULL,
        nu.full_name ASC,
        us.staff_user_id ASC
    `,
    unitIds
  );

  const grouped = new Map<number, UnitStaffRow[]>();
  for (const staff of staffRows) {
    if (!grouped.has(staff.unit_id)) {
      grouped.set(staff.unit_id, []);
    }
    grouped.get(staff.unit_id)!.push(staff);
  }

  return rows.map((row) => {
    const staffList = grouped.get(row.unit_id) ?? [];
    const ids = staffList.map((s) => s.staff_user_id);
    const names = staffList.map((s) => {
      const trimmed = s.full_name?.trim();
      return trimmed && trimmed.length ? trimmed : String(s.staff_user_id);
    });
    const primary = staffList[0];
    return {
      ...row,
      staff_user_id: primary ? primary.staff_user_id : null,
      staff_name: names[0] ?? null,
      staff_user_ids: ids,
      staff_names: names,
    };
  });
}

export async function getUnitsByExhibitionId(exId: string | number): Promise<UnitRowWithStaff[]> {
  if (!/^\d+$/.test(String(exId))) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }

  const rows = await safeQuery<UnitRowBase[]>(
    `
      SELECT
        ${UNIT_FIELDS}
      FROM units u
      WHERE u.exhibition_id = ?
      ORDER BY u.starts_at, u.unit_id
    `,
    [exId]
  );

  return attachStaff(rows);
}

export async function getUnitsById(
  exId: string | number,
  unitId: string | number,
): Promise<UnitRowWithStaff[]> {
  if (!/^\d+$/.test(String(exId)) || !/^\d+$/.test(String(unitId))) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }

  const rows = await safeQuery<UnitRowBase[]>(
    `
      SELECT
        ${UNIT_FIELDS}
      FROM units u
      WHERE u.exhibition_id = ? AND u.unit_id = ?
      LIMIT 1
    `,
    [exId, unitId]
  );

  if (!rows.length) {
    throw new AppError("no units found for this exhibition", 404, "NOT_FOUND");
  }

  return attachStaff(rows);
}

export async function addUnit(payload: AddUnitPayload): Promise<UnitRowWithStaff> {
  const result = await safeQuery<ResultSetHeader>(
    `INSERT INTO units
      (exhibition_id, unit_name, unit_type, description, description_delta, poster_url, detail_pdf_url, starts_at, ends_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.exhibition_id,
      payload.unit_name,
      payload.unit_type,
      payload.description ?? null,
      payload.description_delta ?? null,
      payload.poster_url ?? null,
      payload.detail_pdf_url ?? null,
      payload.starts_at ?? null,
      payload.ends_at ?? null,
    ]
  );

  const staffIds = normaliseStaffIds(
    payload.staff_user_ids ??
      (payload.staff_user_id === undefined
        ? undefined
        : payload.staff_user_id === null
          ? []
          : [payload.staff_user_id])
  );

  if (staffIds !== undefined) {
    await replaceUnitStaffs(result.insertId, staffIds);
  }

  const rows = await safeQuery<UnitRowBase[]>(
    `
      SELECT
        ${UNIT_FIELDS}
      FROM units u
      WHERE u.exhibition_id = ? AND u.unit_id = ?
      LIMIT 1
    `,
    [payload.exhibition_id, result.insertId]
  );

  const unit = (await attachStaff(rows))[0];
  if (!unit) {
    throw new AppError("failed to load created unit", 500, "DB_ERROR");
  }

  return unit;
}

export async function updateUnit(
  exId: string | number,
  unitId: string | number,
  changes: UpdateUnitPayload
): Promise<UnitRowWithStaff> {
  if (!/^\d+$/.test(String(exId)) || !/^\d+$/.test(String(unitId))) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }
  if (!changes || !Object.keys(changes).length) {
    throw new AppError("no fields to update", 400, "VALIDATION_ERROR");
  }

  const { staff_user_ids, staff_user_id, ...scalarChanges } = changes;

  const assignments: string[] = [];
  const params: unknown[] = [];
  const push = (column: string, value: unknown) => {
    assignments.push(`${column} = ?`);
    params.push(value);
  };

  if (scalarChanges.unit_name !== undefined) push("unit_name", scalarChanges.unit_name);
  if (scalarChanges.unit_type !== undefined) push("unit_type", scalarChanges.unit_type);
  if (scalarChanges.description !== undefined) push("description", scalarChanges.description);
  if (scalarChanges.description_delta !== undefined) push("description_delta", scalarChanges.description_delta);
  if (scalarChanges.poster_url !== undefined) push("poster_url", scalarChanges.poster_url);
  if (scalarChanges.detail_pdf_url !== undefined) push("detail_pdf_url", scalarChanges.detail_pdf_url);
  if (scalarChanges.starts_at !== undefined) push("starts_at", scalarChanges.starts_at);
  if (scalarChanges.ends_at !== undefined) push("ends_at", scalarChanges.ends_at);

  const staffIds = normaliseStaffIds(
    staff_user_ids ??
      (staff_user_id === undefined
        ? undefined
        : staff_user_id === null
          ? []
          : [staff_user_id])
  );

  if (!assignments.length && staffIds === undefined) {
    throw new AppError("no fields to update", 400, "VALIDATION_ERROR");
  }

  if (assignments.length) {
    const result = await safeQuery<ResultSetHeader>(
      `UPDATE units SET ${assignments.join(", ")} WHERE exhibition_id = ? AND unit_id = ?`,
      [...params, exId, unitId]
    );

    if (!result.affectedRows) {
      throw new AppError("unit not found for this exhibition", 404, "NOT_FOUND");
    }
  } else {
    const exists = await safeQuery<UnitRowBase[]>(
      `
        SELECT
          ${UNIT_FIELDS}
        FROM units u
        WHERE u.exhibition_id = ? AND u.unit_id = ?
        LIMIT 1
      `,
      [exId, unitId]
    );
    if (!exists.length) {
      throw new AppError("unit not found for this exhibition", 404, "NOT_FOUND");
    }
  }

  if (staffIds !== undefined) {
    await replaceUnitStaffs(Number(unitId), staffIds);
  }

  const rows = await safeQuery<UnitRowBase[]>(
    `
      SELECT
        ${UNIT_FIELDS}
      FROM units u
      WHERE u.exhibition_id = ? AND u.unit_id = ?
      LIMIT 1
    `,
    [exId, unitId]
  );

  const unit = (await attachStaff(rows))[0];
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
