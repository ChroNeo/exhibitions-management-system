import type { FastifyBaseLogger } from "fastify";
import { replyToLineMessage } from "../../line/client.js";
import type { LineConfig } from "../../line/types.js";


export async function handleFollowEvent(
  replyToken: string,
  config: LineConfig,
  log: FastifyBaseLogger
): Promise<void> {
  const messages = [
    { type: "text" as const, text: "ขอบคุณที่ติดตามงานนิทรรศการ EMS ครับ!" },
    { type: "text" as const, text: "สามารถใช้งานผ่าน Rich Menu ด้านล่างได้เลยครับ" },
  ];

  try {
    await replyToLineMessage(replyToken, messages, config);
  } catch (err) {
    log.error({ err }, "failed to send follow welcome message");
  }
}
