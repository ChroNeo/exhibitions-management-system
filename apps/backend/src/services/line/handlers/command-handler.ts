import type { FastifyBaseLogger } from "fastify";
import {
  findExhibitionForLine,
  findUserByLineId,
  getUpcomingExhibitionsForLine,
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
  MEMBER: "richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxx", // ใส่ ID เมนู Member (ถ้ามี)
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
        await unlinkRichMenuFromUser(userId, config);
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

function extractExhibitionCode(input: string): string | null {
  const match = input.toUpperCase().match(/\bEX\d{6}\b/);
  return match ? match[0] : null;
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

function getTicketLiffUrl(): string | null {
  const value =
    process.env.LINE_TICKET_LIFF_URL ??
    process.env.LIFF_TICKET_URL ??
    process.env.FRONTEND_TICKET_LIFF_URL ??
    "https://liff.line.me/2008498720-IgQ8sUzW";
  if (!value) {
    return null;
  }
  return value.trim();
}
