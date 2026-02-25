import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { AppError } from "../errors.js";
import { pool } from "../services/dbconn.js";

export type RegistrationRole = "visitor" | "staff";
export type RegistrationGender = "male" | "female" | "other";

export type RegistrationPayload = {
  exhibition_id: number;
  full_name: string;
  gender?: RegistrationGender;
  birthdate?: string;
  email: string;
  phone?: string;
  role: RegistrationRole;
  unit_code?: string;
  line_user_id?: string;
};

export type RegistrationResult = {
  user: {
    user_id: number;
  };
  registration: {
    registration_id: number;
    exhibition_id: number;
    role: RegistrationRole;
  };
  staff_linked?: {
    unit_id: number;
    added: boolean;
  };
};

type NormalUserRow = RowDataPacket & {
  user_id: number;
};

type UnitRow = RowDataPacket & {
  unit_id: number;
};

type RegistrationIdRow = RowDataPacket & {
  registration_id: number;
};

export async function registerForExhibition(
  payload: RegistrationPayload,
): Promise<RegistrationResult> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existingUsers] = await conn.query<NormalUserRow[]>(
      "SELECT user_id FROM normal_users WHERE email = ? OR line_user_id = ? FOR UPDATE",
      [payload.email, payload.line_user_id],
    );

    let userId: number;

    if (!existingUsers.length) {
      const [insertUser] = await conn.query<ResultSetHeader>(
        `
          INSERT INTO normal_users (
            full_name,
            gender,
            birthdate,
            email,
            phone,
            line_user_id
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          payload.full_name,
          payload.gender ?? null,
          payload.birthdate ?? null,
          payload.email,
          payload.phone ?? null,
          payload.line_user_id ?? null,
        ],
      );
      userId = insertUser.insertId;
    } else {
      const existing = existingUsers[0];
      userId = existing.user_id;
      await conn.query<ResultSetHeader>(
        `
          UPDATE normal_users
          SET full_name = ?,
              gender = ?,
              birthdate = ?,
              phone = ?,
              email = ?,
              line_user_id = COALESCE(?, line_user_id)
          WHERE user_id = ?
        `,
        [
          payload.full_name,
          payload.gender ?? null,
          payload.birthdate ?? null,
          payload.phone ?? null,
          payload.email ?? null,
          payload.line_user_id ?? null,
          userId,
        ],
      );
    }

    const [registrationInsert] = await conn.query<ResultSetHeader>(
      `
        INSERT INTO registrations (exhibition_id, user_id, role)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE role = VALUES(role), registered_at = registered_at
      `,
      [payload.exhibition_id, userId, payload.role],
    );

    let registrationId = registrationInsert.insertId;
    if (!registrationId) {
      const [existingRegistration] = await conn.query<RegistrationIdRow[]>(
        `
          SELECT registration_id
          FROM registrations
          WHERE exhibition_id = ? AND user_id = ?
          LIMIT 1
        `,
        [payload.exhibition_id, userId],
      );
      if (!existingRegistration.length) {
        throw new AppError(
          "registration record not found",
          500,
          "REGISTRATION_NOT_FOUND",
        );
      }
      registrationId = existingRegistration[0].registration_id;
    }

    let staffLinked: RegistrationResult["staff_linked"];
    if (payload.role === "staff") {
      if (!payload.unit_code) {
        throw new AppError(
          "unit_code required for staff registration",
          400,
          "VALIDATION_ERROR",
        );
      }

      const [unitRows] = await conn.query<UnitRow[]>(
        `
          SELECT unit_id
          FROM units
          WHERE unit_code = ? AND exhibition_id = ?
          LIMIT 1
        `,
        [payload.unit_code, payload.exhibition_id],
      );

      if (!unitRows.length) {
        throw new AppError(
          "unit_code not found in this exhibition",
          400,
          "UNIT_NOT_FOUND",
        );
      }

      const unitId = unitRows[0].unit_id;
      const [staffInsert] = await conn.query<ResultSetHeader>(
        `
          INSERT IGNORE INTO unit_staffs (unit_id, staff_user_id)
          VALUES (?, ?)
        `,
        [unitId, userId],
      );

      staffLinked = {
        unit_id: unitId,
        added: staffInsert.affectedRows > 0,
      };
    }

    await conn.commit();

    return {
      user: { user_id: userId },
      registration: {
        registration_id: registrationId,
        exhibition_id: payload.exhibition_id,
        role: payload.role,
      },
      ...(staffLinked ? { staff_linked: staffLinked } : {}),
    };
  } catch (error) {
    await conn.rollback();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      (error as Error)?.message ?? "failed to register for exhibition",
      400,
      "REGISTRATION_ERROR",
    );
  } finally {
    conn.release();
  }
}
