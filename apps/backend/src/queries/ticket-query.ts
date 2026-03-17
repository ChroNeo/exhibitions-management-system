import { AppError } from "../errors.js";
import { safeQuery } from "../services/dbconn.js";

export type UserTicketRow = {
  user_id: number;
  registration_id: number;
  exhibition_id: number;
  title: string;
  exhibition_code: string;
  location: string | null;
  start_date: Date;
  end_date: Date;
  picture_path: string | null;
  status: "draft" | "published" | "ongoing" | "ended" | "archived";
  exhibition_set_id: number | null;
  registered_at: Date;
  survey_completed: number;
};

export type CheckInResult = {
  success: boolean;
  message: string;
  visitor?: {
    full_name: string;
    picture_url: string | null;
    checkin_at: Date;
  };
};
// export async function getUserTickets(userId: number): Promise<UserTicketRow[]> {
//   const rows = await safeQuery<UserTicketRow[]>(
//     `SELECT * FROM v_my_event_surveys
//       WHERE user_id = ?
//       ORDER BY start_date DESC;
//     `,
//     [userId],
//   );
//   return rows;
// }
export async function verifyAndCheckIn(
  staffUserId: number,
  visitorUserId: number,
  exhibitionId: number,
): Promise<CheckInResult> {
  // O3: Parallelize independent queries — staff assignment + unit check + visitor registration
  const [staffAssignment, visitor] = await Promise.all([
    safeQuery<any[]>(
      `SELECT us.unit_id, u.exhibition_id
       FROM unit_staffs us
       JOIN units u ON us.unit_id = u.unit_id
       WHERE us.staff_user_id = ? LIMIT 1`,
      [staffUserId],
    ),
    safeQuery<any[]>(
      `SELECT u.full_name, u.picture_url
       FROM registrations r
       JOIN normal_users u ON r.user_id = u.user_id
       WHERE r.user_id = ? AND r.exhibition_id = ?`,
      [visitorUserId, exhibitionId],
    ),
  ]);

  // Auto-Detect Unit: หาว่า Staff คนนี้คุม Unit ไหน
  if (staffAssignment.length === 0) {
    throw new AppError(
      "คุณยังไม่ได้ถูกมอบหมายให้ประจำจุดสแกนใดๆ (No Unit Assigned)",
      403,
      "NO_UNIT_ASSIGNED",
    );
  }

  const unitId = staffAssignment[0].unit_id;
  const unitExhibitionId = staffAssignment[0].exhibition_id;

  // Check Unit Validity: Unit นี้อยู่ในงานนิทรรศการ เดียวกับตั๋วไหม?
  if (unitExhibitionId !== exhibitionId) {
    throw new AppError(
      "ตั๋วใบนี้สำหรับงานนิทรรศการอื่น ไม่ใช่งานนิทรรศการที่คุณประจำอยู่",
      400,
      "WRONG_EXHIBITION",
    );
  }

  // Check Visitor Registration: Visitor ลงทะเบียนมาไหม?
  if (visitor.length === 0) {
    throw new AppError("ไม่พบข้อมูลการลงทะเบียน", 404, "USER_NOT_FOUND");
  }

  // S1: Insert directly and catch duplicate from UNIQUE constraint (uq_checkin)
  // This eliminates the race condition from SELECT-then-INSERT
  try {
    await safeQuery(
      `INSERT INTO units_checkins (exhibition_id, user_id, unit_id, checkin_at)
       VALUES (?, ?, ?, NOW())`,
      [exhibitionId, visitorUserId, unitId],
    );
  } catch (err: any) {
    if (err?.details?.code === "ER_DUP_ENTRY" || err?.code === "DUPLICATE") {
      const duplicateCheck = await safeQuery<any[]>(
        `SELECT checkin_at FROM units_checkins
         WHERE user_id = ? AND unit_id = ?`,
        [visitorUserId, unitId],
      );
      return {
        success: false,
        message: `สแกนซ้ำ! เช็คอินไปแล้วเมื่อ ${new Date(duplicateCheck[0].checkin_at).toLocaleTimeString("th-TH")}`,
        visitor: {
          full_name: visitor[0].full_name,
          picture_url: visitor[0].picture_url,
          checkin_at: duplicateCheck[0].checkin_at,
        },
      };
    }
    throw err;
  }

  return {
    success: true,
    message: "เช็คอินสำเร็จ",
    visitor: {
      full_name: visitor[0].full_name,
      picture_url: visitor[0].picture_url,
      checkin_at: new Date(),
    },
  };
}
