import { AppError } from "../errors.js";
import { safeQuery } from "../services/dbconn.js";

export async function getExhibitionsList(): Promise<any[]> {
  const rows = await safeQuery(`
<<<<<<< Updated upstream
    SELECT title, location, description, start_date, end_date
    FROM exhibitions
=======
    SELECT *
    FROM v_exhibitions
>>>>>>> Stashed changes
    ORDER BY start_date ASC
  `);
  return rows;
}

export async function getExhibitionById(id: string | number): Promise<any> {
  if (!/^\d+$/.test(String(id))) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }
  const rows = await safeQuery(
<<<<<<< Updated upstream
    `SELECT * FROM exhibitions WHERE exhibition_id = ?`,
=======
    `SELECT * FROM v_exhibitions WHERE exhibition_id = ?`,
>>>>>>> Stashed changes
    [id]
  );
  if (!rows.length) {
    throw new AppError("exhibition not found", 404, "NOT_FOUND");
  }
  return rows[0];
}
