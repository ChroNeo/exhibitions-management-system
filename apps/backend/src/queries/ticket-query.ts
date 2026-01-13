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
  status: 'draft' | 'published' | 'ongoing' | 'ended' | 'archived';
  exhibition_set_id: number | null;
  registered_at: Date;
  survey_completed: number;
};

export type UserRegistrationData = {
  user_id: number;
  line_user_id: string;
  full_name: string;
  email: string | null;
  exhibitions: number[];
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

export async function getUserRegistrationsByLineId(
  lineUserId: string
): Promise<UserRegistrationData | null> {
  if (!lineUserId?.trim()) {
    return null;
  }

  // First, get the user by LINE ID
  const [user] = await safeQuery<Array<{
    user_id: number;
    line_user_id: string;
    full_name: string;
    email: string | null;
  }>>(
    `SELECT user_id, line_user_id, full_name, email
     FROM normal_users
     WHERE line_user_id = ?
     LIMIT 1`,
    [lineUserId]
  );

  if (!user) {
    return null;
  }

  // Get all exhibition registrations for this user
  const registrations = await safeQuery<Array<{ exhibition_id: number }>>(
    `SELECT exhibition_id
     FROM registrations
     WHERE user_id = ?
     ORDER BY exhibition_id ASC`,
    [user.user_id]
  );

  return {
    user_id: user.user_id,
    line_user_id: user.line_user_id,
    full_name: user.full_name,
    email: user.email,
    exhibitions: registrations.map((r) => r.exhibition_id),
  };


}
export async function getUserTickets(userId: number): Promise<UserTicketRow[]> {
  const rows = await safeQuery<UserTicketRow[]>(
    `SELECT * FROM v_my_event_surveys 
      WHERE user_id = ? 
      ORDER BY start_date DESC;
    `,
    [userId]
  );
  return rows;
}
export async function verifyAndCheckIn(
  staffUserId: number,    // รับแค่ Staff ID
  visitorUserId: number,  // Visitor ID
  exhibitionId: number    // Exhibition ID (จาก QR)
): Promise<CheckInResult> {

  // 1. 🔍 Auto-Detect Unit: หาว่า Staff คนนี้คุม Unit ไหน?
  const staffAssignment = await safeQuery<any[]>(
    `SELECT unit_id FROM unit_staffs WHERE staff_user_id = ? LIMIT 1`,
    [staffUserId]
  );

  if (staffAssignment.length === 0) {
    throw new AppError("คุณยังไม่ได้ถูกมอบหมายให้ประจำจุดสแกนใดๆ (No Unit Assigned)", 403, "NO_UNIT_ASSIGNED");
  }

  const unitId = staffAssignment[0].unit_id; // ✅ ได้ Unit ID แล้ว!

  // 2. 🎫 Check Unit Validity: Unit นี้อยู่ในงาน Exhibition เดียวกับตั๋วไหม?
  const unitCheck = await safeQuery<any[]>(
    `SELECT exhibition_id FROM units WHERE unit_id = ?`,
    [unitId]
  );

  if (unitCheck.length === 0 || unitCheck[0].exhibition_id !== exhibitionId) {
    // กรณี Staff อยู่บูธของ "งาน A" แต่ Visitor เอา QR "งาน B" มาสแกน
    throw new AppError("ตั๋วใบนี้สำหรับงานอื่น ไม่ใช่งานที่คุณประจำอยู่", 400, "WRONG_EXHIBITION");
  }

  // 3. 👤 Check Visitor Registration: Visitor ลงทะเบียนมาไหม?
  const visitor = await safeQuery<any[]>(
    `SELECT u.full_name, u.picture_url
     FROM registrations r
     JOIN normal_users u ON r.user_id = u.user_id
     WHERE r.user_id = ? AND r.exhibition_id = ?`,
    [visitorUserId, exhibitionId]
  );

  if (visitor.length === 0) {
    throw new AppError("ไม่พบข้อมูลการลงทะเบียน", 404, "USER_NOT_FOUND");
  }

  // 4. ⚠️ Check Duplicate: เคยสแกนที่ Unit นี้หรือยัง?
  const duplicateCheck = await safeQuery<any[]>(
    `SELECT checkin_at FROM units_checkins 
     WHERE user_id = ? AND unit_id = ?`,
    [visitorUserId, unitId]
  );

  if (duplicateCheck.length > 0) {
    return {
      success: false,
      message: `สแกนซ้ำ! เช็คอินไปแล้วเมื่อ ${new Date(duplicateCheck[0].checkin_at).toLocaleTimeString('th-TH')}`,
      visitor: {
        full_name: visitor[0].full_name,
        picture_url: visitor[0].picture_url,
        checkin_at: duplicateCheck[0].checkin_at
      }
    };
  }

  // 5. ✅ Record Check-in
  await safeQuery(
    `INSERT INTO units_checkins (exhibition_id, user_id, unit_id, checkin_at)
     VALUES (?, ?, ?, NOW())`,
    [exhibitionId, visitorUserId, unitId]
  );

  return {
    success: true,
    message: "เช็คอินสำเร็จ",
    visitor: {
      full_name: visitor[0].full_name,
      picture_url: visitor[0].picture_url,
      checkin_at: new Date()
    }
  };
}