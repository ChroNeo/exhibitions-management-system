import type { FastifyBaseLogger } from "fastify";
import {
  findExhibitionForLine,
  findUserByLineId,
  getUpcomingExhibitionsForLine,
  getExhibitionsWithUnitsForUser,
  getExhibitionIdByCode,
} from "../../../queries/line-query.js";
import { linkRichMenuToUser, replyToLineMessage, unlinkRichMenuFromUser } from "../../line/client.js";
import type { LineConfig, LineMessage } from "../../line/types.js";
import {
  HELP_TEXT,
  formatExhibitionDetail,
  formatUpcomingExhibitions,
} from "../utils/message-formatter.js";

const RICH_MENU_IDS = {
  STAFF: "richmenu-89c0938cdb1b6ca00dc2f86fc67f2b66",  // ใส่ ID เมนู Staff
  MEMBER: "richmenu-e3134670565e0d2e892bbfa0113fa4bc", // ใส่ ID เมนู Member (ถ้ามี)
};
export async function handleMessageCommand(
  replyToken: string,
  userId: string,
  messageText: string,
  config: LineConfig,
  log: FastifyBaseLogger
): Promise<void> {
  const trimmed = messageText.trim();
  if (!trimmed) {
    await sendLineTexts(replyToken, [HELP_TEXT], config, log);
    return;
  }

  const normalized = trimmed.toLowerCase();

  if (isStartCommand(normalized)) {
    const user = await findUserByLineId(userId);
    const role = user?.role || "user";
    try {
      if (role === "staff") {
        await linkRichMenuToUser(userId, RICH_MENU_IDS.STAFF, config);
        await sendLineTexts(replyToken, ["ยืนยันตัวตน: Staff ✅", "เปลี่ยนเมนูเรียบร้อยครับ"], config, log);
      } else {
        // กรณี user ทั่วไป อาจจะ unlink หรือ link menu member
        await linkRichMenuToUser(userId, RICH_MENU_IDS.MEMBER, config);
        await sendLineTexts(replyToken, ["ยินดีต้อนรับครับ", HELP_TEXT], config, log);
      }
    } catch (err) {
      log.error({ err }, "Failed to switch rich menu");
      await sendLineTexts(replyToken, ["เกิดข้อผิดพลาดในการเปลี่ยนเมนู"], config, log);
    }
    return;
  }
  if (normalized === "#staff_mode") {
    await linkRichMenuToUser(userId, RICH_MENU_IDS.STAFF, config);
    await sendLineTexts(replyToken, ["เข้าสู่โหมด Staff"], config, log);
    return;
  }

  if (isProfileCommand(normalized)) {
    await sendProfileLiff(replyToken, config, log);
    return;
  }

  // Check for specific certificate download request FIRST (e.g., "ขอเกียรติบัตร EX123456")
  const certificateCode = extractCertificateRequestCode(trimmed);
  if (certificateCode) {
    await handleCertificateDownloadRequest(replyToken, userId, certificateCode, config, log);
    return;
  }

  // General certificate status (shows all exhibitions)
  if (isCertificateCommand(normalized)) {
    await sendCertificateMessage(replyToken, userId, config, log);
    return;
  }

  if (isHelpCommand(normalized)) {
    await sendLineTexts(replyToken, [HELP_TEXT], config, log);
    return;
  }
  if (isListCommand(normalized)) {
    const exhibitions = await getUpcomingExhibitionsForLine(5);
    if (!exhibitions.length) {
      await sendLineTexts(
        replyToken,
        ["ตอนนี้ยังไม่มีกิจกรรมที่เปิดอยู่", HELP_TEXT],
        config,
        log
      );
      return;
    }
    await sendLineTexts(
      replyToken,
      [
        formatUpcomingExhibitions(exhibitions),
        'พิมพ์รหัสงาน (เช่น EX202501) เพื่อดูรายละเอียดเพิ่มเติม',
      ],
      config,
      log
    );
    return;
  }
  const code = extractExhibitionCode(trimmed);
  if (code) {
    const exhibition = await findExhibitionForLine(code);
    if (!exhibition) {
      await sendLineTexts(
        replyToken,
        [`ไม่พบงานที่มีรหัส ${code}`, 'พิมพ์ "list" เพื่อดูกิจกรรมที่เปิดอยู่'],
        config,
        log
      );
      return;
    }
    await sendLineTexts(replyToken, [formatExhibitionDetail(exhibition)], config, log);
    return;
  }

  await sendLineTexts(
    replyToken,
    [`ยังไม่เข้าใจข้อความ "${trimmed}"`, HELP_TEXT],
    config,
    log
  );
}

async function sendLineTexts(
  replyToken: string,
  texts: string[],
  config: LineConfig,
  log: FastifyBaseLogger
): Promise<void> {
  const sanitized = texts
    .map((text) => text?.trim())
    .filter((text): text is string => Boolean(text))
    .slice(0, 5);

  if (!sanitized.length) {
    return;
  }

  try {
    await replyToLineMessage(
      replyToken,
      sanitized.map((text) => ({ type: "text" as const, text })),
      config
    );
  } catch (err) {
    log.error({ err }, "failed to reply to LINE message");
  }
}

async function sendProfileLiff(
  replyToken: string,
  config: LineConfig,
  log: FastifyBaseLogger
): Promise<void> {
  const profileUrl = getProfileLiffUrl();
  if (!profileUrl) {
    await sendLineTexts(
      replyToken,
      [
        "ยังไม่ได้ตั้งค่า URL สำหรับโปรไฟล์ LIFF",
        'กรุณาตั้งค่า environment variable LINE_PROFILE_LIFF_URL (ชี้ไปที่ /profile.html)',
      ],
      config,
      log
    );
    return;
  }

  const messages: LineMessage[] = [
    { type: "text", text: "กดปุ่มด้านล่างเพื่อดูโปรไฟล์ของคุณ 👤" },
    {
      type: "template",
      altText: "View Profile",
      template: {
        type: "buttons",
        text: "คลิกเพื่อดูข้อมูลโปรไฟล์",
        actions: [
          {
            type: "uri",
            label: "📋 View Profile",
            uri: profileUrl,
          },
        ],
      },
    },
  ];

  try {
    await replyToLineMessage(replyToken, messages, config);
  } catch (err) {
    log.error({ err }, "failed to reply with LIFF profile template");
  }
}
function isStartCommand(normalized: string): boolean {
  return (
    normalized === "start" ||
    normalized === "check" ||
    normalized === "ตรวจสอบ" ||
    normalized === "เริ่ม" ||
    normalized === "เมนู"
  );
}

function isHelpCommand(normalized: string): boolean {
  return (
    normalized === "help" ||
    normalized === "?" ||
    normalized.includes("help") ||
    normalized.includes("assist") ||
    normalized.includes("เมนู")
  );
}

function isProfileCommand(normalized: string): boolean {
  return (
    normalized === "profile" ||
    normalized.includes("profile") ||
    normalized.includes("โปรไฟล์")
  );
}

function isListCommand(normalized: string): boolean {
  if (
    normalized.startsWith("list") ||
    normalized.startsWith("show") ||
    normalized.includes("event") ||
    normalized.includes("งาน") ||
    normalized.includes("ดูกิจกรรม") ||
    normalized.includes("นิทรรศการ")
  ) {
    return true;
  }
  return false;
}
function isCertificateCommand(normalized: string): boolean {
  return (
    normalized === "certificate" ||
    normalized === "cert" ||
    normalized.includes("certificate") ||
    normalized.includes("cert") ||
    normalized === "เกียรติบัตร" ||
    normalized.includes("เกียรติบัตร") ||
    normalized.includes("ใบประกาศ")
  );
}
function extractExhibitionCode(input: string): string | null {
  const match = input.toUpperCase().match(/\bEX\d{6}\b/);
  return match ? match[0] : null;
}

function extractCertificateRequestCode(input: string): string | null {
  // Match "ขอเกียรติบัตร EX123456" pattern
  const match = input.match(/ขอเกียรติบัตร\s*(EX\d{6})/i);
  return match ? match[1].toUpperCase() : null;
}

function getProfileLiffUrl(): string | null {
  const value =
    process.env.LINE_PROFILE_LIFF_URL ??
    process.env.LIFF_PROFILE_URL ??
    process.env.FRONTEND_PROFILE_LIFF_URL ??
    "https://liff.line.me/2008498720-weKz53ER";
  if (!value) {
    return null;
  }
  return value.trim();
}

async function sendCertificateMessage(
  replyToken: string,
  userId: string,
  config: LineConfig,
  log: FastifyBaseLogger
): Promise<void> {
  // Step 1: Find the user by LINE ID
  const user = await findUserByLineId(userId);

  if (!user) {
    await sendLineTexts(
      replyToken,
      ["ไม่พบข้อมูลผู้ใช้ในระบบ", "กรุณาลงทะเบียนก่อนขอเกียรติบัตร"],
      config,
      log
    );
    return;
  }

  // Step 2: Get exhibitions and units for this user
  const exhibitionsWithUnits = await getExhibitionsWithUnitsForUser(user.userId);

  if (!exhibitionsWithUnits.length) {
    await sendLineTexts(
      replyToken,
      ["คุณยังไม่ได้ลงทะเบียนเข้าร่วมงานใดๆ", "กรุณาลงทะเบียนเข้าร่วมงานก่อนขอเกียรติบัตร"],
      config,
      log
    );
    return;
  }

  // Group units by exhibition with check-in status
  const exhibitionsMap = new Map<number, {
    code: string;
    title: string;
    units: Array<{
      id: number;
      code: string | null;
      name: string;
      type: 'activity' | 'booth';
      isCheckedIn: boolean;
    }>;
  }>();

  for (const row of exhibitionsWithUnits) {
    if (!exhibitionsMap.has(row.exhibition_id)) {
      exhibitionsMap.set(row.exhibition_id, {
        code: row.exhibition_code,
        title: row.exhibition_title,
        units: [],
      });
    }

    // Add unit if it exists
    if (row.unit_id !== null && row.unit_name !== null && row.unit_type !== null) {
      exhibitionsMap.get(row.exhibition_id)!.units.push({
        id: row.unit_id,
        code: row.unit_code,
        name: row.unit_name,
        type: row.unit_type,
        isCheckedIn: row.is_checked_in === 1,
      });
    }
  }

  // Create Flex Messages for each exhibition
  const flexMessages: LineMessage[] = [];

  for (const [exhibitionId, exhibition] of exhibitionsMap.entries()) {
    if (exhibition.units.length === 0) continue;

    const totalUnits = exhibition.units.length;
    const checkedInCount = exhibition.units.filter(u => u.isCheckedIn).length;
    const progress = totalUnits > 0 ? (checkedInCount / totalUnits) * 100 : 0;
    const isCompleted = checkedInCount === totalUnits;

    // Create unit list items
    const unitItems = exhibition.units.map(unit => ({
      type: "box" as const,
      layout: "horizontal" as const,
      contents: [
        {
          type: "text" as const,
          text: unit.isCheckedIn ? "✅" : "⬜",
          size: "sm" as const,
          flex: 0,
        },
        {
          type: "text" as const,
          text: unit.name,
          size: "sm" as const,
          wrap: true,
          color: unit.isCheckedIn ? "#666666" : "#AAAAAA",
          flex: 1,
        },
      ],
      spacing: "sm" as const,
      margin: "sm" as const,
    }));

    const flexMessage: LineMessage = {
      type: "flex",
      altText: `สถานะการเข้าร่วม: ${exhibition.title}`,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "สถานะการเข้าร่วม",
              weight: "bold",
              size: "lg",
              color: "#FFFFFF",
            },
            {
              type: "text",
              text: exhibition.title,
              size: "xs",
              color: "#FFFFFFCC",
              margin: "sm",
            },
          ],
          backgroundColor: "#27ACB2",
          paddingAll: "20px",
        },
        hero: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `${checkedInCount} / ${totalUnits}`,
              size: "4xl",
              weight: "bold",
              align: "center",
              color: isCompleted ? "#06C755" : "#27ACB2",
            },
            {
              type: "text",
              text: "กิจกรรมที่เข้าร่วม",
              size: "xs",
              align: "center",
              color: "#999999",
              margin: "sm",
            },
            // Progress bar
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [],
                  width: `${progress}%`,
                  backgroundColor: isCompleted ? "#06C755" : "#27ACB2",
                  height: "6px",
                },
              ],
              backgroundColor: "#E0E0E0",
              height: "6px",
              margin: "md",
            },
          ],
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "รายการกิจกรรม",
              weight: "bold",
              size: "sm",
              margin: "none",
            },
            {
              type: "separator",
              margin: "md",
            },
            ...unitItems,
          ],
          paddingAll: "20px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              action: {
                type: "message",
                label: isCompleted ? "🎓 รับเกียรติบัตร" : "ดูรายชื่อกิจกรรมทั้งหมด",
                text: isCompleted ? `ขอเกียรติบัตร ${exhibition.code}` : `list`,
              },
              style: isCompleted ? "primary" : "secondary",
              color: isCompleted ? "#06C755" : "#27ACB2",
            },
          ],
          paddingAll: "20px",
        },
      },
    };

    flexMessages.push(flexMessage);
  }

  // Send all Flex Messages
  try {
    await replyToLineMessage(replyToken, flexMessages, config);
  } catch (err) {
    log.error({ err }, "Failed to send certificate flex message");
    await sendLineTexts(replyToken, ["เกิดข้อผิดพลาดในการแสดงสถานะ"], config, log);
  }
}

async function handleCertificateDownloadRequest(
  replyToken: string,
  lineUserId: string,
  exhibitionCode: string,
  config: LineConfig,
  log: FastifyBaseLogger
): Promise<void> {
  // Step 1: Find user by LINE ID
  const user = await findUserByLineId(lineUserId);
  if (!user) {
    await sendLineTexts(
      replyToken,
      ["ไม่พบข้อมูลผู้ใช้ในระบบ", "กรุณาลงทะเบียนก่อนขอเกียรติบัตร"],
      config,
      log
    );
    return;
  }

  // Step 2: Get exhibition ID by code
  const exhibitionId = await getExhibitionIdByCode(exhibitionCode);
  if (!exhibitionId) {
    await sendLineTexts(
      replyToken,
      [`ไม่พบงานที่มีรหัส ${exhibitionCode}`, 'พิมพ์ "เกียรติบัตร" เพื่อดูสถานะการเข้าร่วม'],
      config,
      log
    );
    return;
  }

  // Step 3: Build certificate download URL
  const baseUrl = process.env.VITE_BASE || process.env.API_BASE_URL || "https://api.chroneo.dev";
  const downloadUrl = `${baseUrl}/api/v1/exhibitions/${exhibitionId}/certificates/${user.userId}/download`;

  // Step 4: Send download link via template message
  const messages: LineMessage[] = [
    {
      type: "text",
      text: "🎉 ยินดีด้วย! คุณเข้าร่วมครบทุกกิจกรรมแล้ว",
    },
    {
      type: "template",
      altText: "ดาวน์โหลดเกียรติบัตร",
      template: {
        type: "buttons",
        text: `กดปุ่มด้านล่างเพื่อดาวน์โหลดเกียรติบัตรของคุณ\n\nรหัสงาน: ${exhibitionCode}`,
        actions: [
          {
            type: "uri",
            label: "📜 ดาวน์โหลดเกียรติบัตร",
            uri: downloadUrl,
          },
        ],
      },
    },
  ];

  try {
    await replyToLineMessage(replyToken, messages, config);
  } catch (err) {
    log.error({ err }, "Failed to send certificate download message");
    await sendLineTexts(replyToken, ["เกิดข้อผิดพลาดในการส่งลิงก์ดาวน์โหลด"], config, log);
  }
}

