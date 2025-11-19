import type {
  FastifyBaseLogger,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { AppError } from "../errors.js";
import {
  findExhibitionForLine,
  getUpcomingExhibitionsForLine,
  markLineUserUnfollowed,
  upsertLineUserProfile,
  type LineExhibitionDetailRow,
  type LineExhibitionSummaryRow,
} from "../queries/line-query.js";
import {
  fetchLineProfile,
  getLineConfig,
  replyToLineMessage,
  verifyLineSignature,
  type LineConfig,
} from "../services/line.js";

type RawBodyRequest = FastifyRequest & {
  rawBody?: string | Buffer;
};

type LineEvent = {
  type: string;
  replyToken?: string;
  source?: {
    type?: string;
    userId?: string;
  };
  message?: {
    type?: string;
    text?: string;
  };
};

type LineWebhookPayload = {
  events?: LineEvent[];
};

const HELP_TEXT =
  'พิมพ์ "list" หรือ "ดูงาน" เพื่อดูกิจกรรมที่กำลังเปิดอยู่\nพิมพ์รหัสงาน เช่น EX202501 เพื่อดูรายละเอียด\nพิมพ์ "help" เพื่อดูคำสั่งนี้อีกครั้ง';

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function lineController(app: FastifyInstance) {
  app.post(
    "/webhook",
    {
      config: {
        rawBody: true,
      },
      schema: {
        tags: ["LINE"],
        summary: "LINE webhook endpoint",
        description: "Receives events from LINE Messaging API",
        hide: true,
      },
    },
    async (req: RawBodyRequest, reply: FastifyReply) => {
      const signatureHeader = req.headers["x-line-signature"];
      if (typeof signatureHeader !== "string") {
        reply.code(400).send({ message: "missing LINE signature header" });
        return;
      }

      if (!req.rawBody) {
        throw new AppError(
          "rawBody is not available for LINE webhook",
          500,
          "CONFIG_ERROR"
        );
      }

      const config = getLineConfig();
      const isValidSignature = verifyLineSignature(signatureHeader, req.rawBody, config);
      if (!isValidSignature) {
        reply.code(401).send({ message: "invalid LINE signature" });
        return;
      }

      const payload = req.body as LineWebhookPayload;
      const events = payload?.events ?? [];
      if (!events.length) {
        reply.send({ ok: true });
        return;
      }

      await Promise.all(
        events.map((event) =>
          processLineEvent(event, config, app.log).catch((err) => {
            app.log.error({ err, event }, "failed to process LINE event");
          })
        )
      );

      reply.send({ ok: true });
    }
  );
}

async function processLineEvent(
  event: LineEvent,
  config: LineConfig,
  log: FastifyBaseLogger
): Promise<void> {
  const sourceType = event.source?.type;
  const userId = event.source?.userId;

  if (event.type === "unfollow" && userId) {
    await markLineUserUnfollowed(userId);
    return;
  }

  if (sourceType !== "user" || !userId) {
    log.info({ sourceType }, "ignoring LINE event without direct user source");
    return;
  }

  try {
    const profile = await fetchLineProfile(userId, config);
    await upsertLineUserProfile({
      line_user_id: profile.userId,
      display_name: profile.displayName,
      picture_url: profile.pictureUrl ?? null,
    });
  } catch (err) {
    log.error({ err }, "failed to sync LINE profile");
  }

  if (event.type === "follow" && event.replyToken) {
    await sendLineTexts(
      event.replyToken,
      [
        "ขอบคุณที่ติดตามงานนิทรรศการ EMS!",
        "ต้องการดูกิจกรรมที่เปิดอยู่หรือรายละเอียดงานใด พิมพ์รหัสหรือคำสั่งได้เลย",
        HELP_TEXT,
      ],
      config,
      log
    );
    return;
  }

  if (event.type === "message" && event.message?.type === "text" && event.replyToken) {
    const responses = await buildMessageResponse(event.message.text ?? "");
    await sendLineTexts(event.replyToken, responses, config, log);
    return;
  }

  log.info({ type: event.type }, "LINE event type not handled");
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

async function buildMessageResponse(input: string): Promise<string[]> {
  const trimmed = input.trim();
  if (!trimmed) {
    return [HELP_TEXT];
  }

  const normalized = trimmed.toLowerCase();
  if (isHelpCommand(normalized)) {
    return [HELP_TEXT];
  }

  if (isListCommand(normalized)) {
    const exhibitions = await getUpcomingExhibitionsForLine(5);
    if (!exhibitions.length) {
      return ["ตอนนี้ยังไม่มีกิจกรรมที่เปิดอยู่", HELP_TEXT];
    }
    return [
      formatUpcomingExhibitions(exhibitions),
      'พิมพ์รหัสงาน (เช่น EX202501) เพื่อดูรายละเอียดเพิ่มเติม',
    ];
  }

  const code = extractExhibitionCode(trimmed);
  if (code) {
    const exhibition = await findExhibitionForLine(code);
    if (!exhibition) {
      return [`ไม่พบงานที่มีรหัส ${code}`, 'พิมพ์ "list" เพื่อดูกิจกรรมที่เปิดอยู่'];
    }
    return [formatExhibitionDetail(exhibition)];
  }

  return [
    `ยังไม่เข้าใจข้อความ "${trimmed}"`,
    HELP_TEXT,
  ];
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

function formatUpcomingExhibitions(rows: LineExhibitionSummaryRow[]): string {
  const lines = rows.map((row, index) => {
    const start = formatDate(row.start_date);
    const location = row.location ? ` @ ${row.location}` : "";
    return `${index + 1}. ${row.title}\n   รหัส ${row.exhibition_code}\n   เริ่ม ${start}${location}`;
  });
  return `งานที่กำลังเปิดอยู่:\n${lines.join("\n\n")}`;
}

function formatExhibitionDetail(row: LineExhibitionDetailRow): string {
  const start = formatDate(row.start_date);
  const end = formatDate(row.end_date);
  const description = row.description ? truncateText(stripHtml(row.description), 280) : null;
  const segments = [
    `${row.title} (${row.exhibition_code})`,
    `ช่วงจัดงาน: ${start} - ${end}`,
    `สถานที่: ${row.location ?? "-"}`,
    `ผู้จัด: ${row.organizer_name}`,
  ];

  if (description) {
    segments.push("");
    segments.push(`รายละเอียด: ${description}`);
  }

  return segments.join("\n");
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dateFormatter.format(date);
}

function stripHtml(input: string): string {
  return input.replace(/<\/?[^>]+>/gi, " ").replace(/\s+/g, " ").trim();
}

function truncateText(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input;
  }
  return `${input.slice(0, maxLength - 3)}...`;
}
