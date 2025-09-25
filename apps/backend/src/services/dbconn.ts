import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function safeQuery<T = any>(
  sql: string,
  params: any[] = []
): Promise<T> {
  try {
    const [rows] = await pool.query(sql, params as any);
    return rows as T;
  } catch (err: any) {
    // จัดหมวด error พื้นฐานจาก mysql2
    const map: Record<string, [number, string]> = {
      ER_DUP_ENTRY: [409, "DUPLICATE"],
      ER_NO_REFERENCED_ROW_2: [409, "FK_CONSTRAINT"],
      ER_BAD_FIELD_ERROR: [400, "BAD_FIELD"],
      ER_PARSE_ERROR: [400, "SQL_SYNTAX"],
    };
    const picked = map[err?.code] || [500, "DB_ERROR"];
    const { AppError } = await import("../errors.js");
    throw new AppError(err?.message ?? "DB error", picked[0], picked[1], {
      code: err?.code,
    });
  }
}
