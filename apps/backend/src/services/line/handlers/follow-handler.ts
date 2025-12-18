import type { FastifyBaseLogger } from "fastify";
import { replyToLineMessage } from "../../line/client.js";
import type { LineConfig } from "../../line/types.js";
import { HELP_TEXT } from "../utils/message-formatter.js";


export async function handleFollowEvent(
  replyToken: string,
  config: LineConfig,
  log: FastifyBaseLogger
): Promise<void> {
  const messages = [
    { type: "text" as const, text: "ขอบคุณที่ติดตามงานนิทรรศการ EMS!" },
    { type: "text" as const, text: "ต้องการดูกิจกรรมที่เปิดอยู่หรือรายละเอียดงานใด พิมพ์รหัสหรือคำสั่งได้เลย" },
    { type: "text" as const, text: HELP_TEXT },
  ];

  try {
    await replyToLineMessage(replyToken, messages, config);
  } catch (err) {
    log.error({ err }, "failed to send follow welcome message");
  }
}
