import { AppError } from "../errors.js";
import { safeQuery } from "../services/dbconn.js";

export type UserTicketRow = {
  registration_id: number;
  exhibition_id: number;
  title: string;
  code: string;
  location: string | null;
  start_date: Date;
  end_date: Date;
  picture_path: string | null;
  status: string;
  registered_at: Date;
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
    `SELECT 
       r.registration_id,
       e.exhibition_id,
       e.title,
       e.exhibition_code AS code,
       e.location,
       e.start_date,
       e.end_date,
       e.picture_path,
       e.status,
       r.registered_at
     FROM registrations r
     JOIN exhibitions e ON r.exhibition_id = e.exhibition_id
     WHERE r.user_id = ?
     ORDER BY e.start_date DESC`,
    [userId]
  );
  return rows;
}
export async function verifyAndCheckIn(
  staffUserId: number,    // ID ของ Staff ที่ถือเครื่องสแกน
  visitorUserId: number,  // ID ของ User ที่มาเข้างาน
  exhibitionId: number,   // ID งาน (จาก QR)
  unitId: number          // ID จุดที่สแกน (เช่น บูธ A)
): Promise<CheckInResult> {

  // 1. 👮 Check Staff Permission: Staff คนนี้มีสิทธิ์คุม Unit นี้ไหม?
  // (เช็คจากตาราง unit_staffs)
  const staffPerm = await safeQuery<any[]>(
    `SELECT * FROM unit_staffs WHERE unit_id = ? AND staff_user_id = ?`,
    [unitId, staffUserId]
  );

  if (staffPerm.length === 0) {
    throw new AppError("คุณไม่มีสิทธิ์ตรวจสอบจุดนี้ (Staff Permission Denied)", 403, "FORBIDDEN_STAFF");
  }

  // 2. 🎫 Check Unit Validity: Unit นี้อยู่ในงาน Exhibition เดียวกับตั๋วไหม?
  // (กัน Staff เอาเครื่องสแกนงาน A ไปสแกนตั๋วงาน B)
  const unitCheck = await safeQuery<any[]>(
    `SELECT exhibition_id FROM units WHERE unit_id = ?`,
    [unitId]
  );

  if (unitCheck.length === 0 || unitCheck[0].exhibition_id !== exhibitionId) {
    throw new AppError("จุดสแกนนี้ไม่ได้อยู่ในงานนิทรรศการที่ระบุ (Invalid Unit for this Ticket)", 400, "INVALID_UNIT");
  }

  // 3. 👤 Check Visitor Registration: User ลงทะเบียนงานนี้จริงไหม?
  const visitor = await safeQuery<any[]>(
    `SELECT u.full_name, u.picture_url
     FROM registrations r
     JOIN normal_users u ON r.user_id = u.user_id
     WHERE r.user_id = ? AND r.exhibition_id = ?`,
    [visitorUserId, exhibitionId]
  );

  if (visitor.length === 0) {
    throw new AppError("ไม่พบข้อมูลการลงทะเบียน (User Not Registered)", 404, "USER_NOT_FOUND");
  }

  // 4. ⚠️ Check Duplicate: เคยสแกนจุดนี้ไปหรือยัง?
  const duplicateCheck = await safeQuery<any[]>(
    `SELECT checkin_at FROM units_checkins 
     WHERE user_id = ? AND unit_id = ?`,
    [visitorUserId, unitId]
  );

  if (duplicateCheck.length > 0) {
    return {
      success: false,
      message: `⚠️ บัตรนี้ถูกสแกนที่จุดนี้ไปแล้วเมื่อ ${new Date(duplicateCheck[0].checkin_at).toLocaleTimeString('th-TH')}`,
      visitor: {
        full_name: visitor[0].full_name,
        picture_url: visitor[0].picture_url,
        checkin_at: duplicateCheck[0].checkin_at
      }
    };
  }

  // 5. ✅ Record Check-in: บันทึกลง DB
  await safeQuery(
    `INSERT INTO units_checkins (exhibition_id, user_id, unit_id, checkin_at)
     VALUES (?, ?, ?, NOW())`,
    [exhibitionId, visitorUserId, unitId]
  );

  return {
    success: true,
    message: "✅ เช็คอินสำเร็จ (Check-in Success)",
    visitor: {
      full_name: visitor[0].full_name,
      picture_url: visitor[0].picture_url,
      checkin_at: new Date()
    }
  };
}