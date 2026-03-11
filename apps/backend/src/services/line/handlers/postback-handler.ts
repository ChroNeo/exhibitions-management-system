import type { FastifyBaseLogger } from "fastify";
import {
  findRegistrationByUserAndExhibition,
  findUserByLineId,
  getExhibitionTitleById,
  setCurrentExhibition,
} from "../../../queries/line-query.js";
import { linkRichMenuToUser, replyToLineMessage } from "../client.js";
import type { LineConfig, LineMessage } from "../types.js";
import { HELP_TEXT, staff_Help_text } from "../utils/message-formatter.js";

const RICH_MENU_IDS = {
  STAFF: "richmenu-0fd067f1629b1eb3ddffd0d619aa0f6c",
  MEMBER: "richmenu-105e3b56020a5d67fd5b09d40e154c84",
};

const LIFF_REGISTRATION_ID = "2008498720-KaJrlZBN";

function buildRegistrationFlexMessage(
  headerText: string,
  exhibitionId: number,
): LineMessage {
  return {
    type: "flex" as const,
    altText: headerText,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: headerText,
            weight: "bold",
            size: "md",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#27ACB2",
            action: {
              type: "uri",
              label: "ลงทะเบียน",
              uri: `https://liff.line.me/${LIFF_REGISTRATION_ID}?exhibitionId=${exhibitionId}`,
            },
          },
        ],
      },
    },
  };
}

export async function handlePostbackEvent(
  replyToken: string,
  userId: string,
  postbackData: string,
  config: LineConfig,
  log: FastifyBaseLogger,
): Promise<void> {
  const params = new URLSearchParams(postbackData);
  const action = params.get("action");

  if (action === "enter_exhibition") {
    const exhibitionId = Number(params.get("exhibitionId"));
    if (!exhibitionId) {
      log.warn({ postbackData }, "Missing exhibitionId in postback");
      return;
    }
    await handleEnterExhibition(replyToken, userId, exhibitionId, config, log);
    return;
  }

  log.info({ action }, "Unhandled postback action");
}

async function handleEnterExhibition(
  replyToken: string,
  userId: string,
  exhibitionId: number,
  config: LineConfig,
  log: FastifyBaseLogger,
): Promise<void> {
  const user = await findUserByLineId(userId);

  if (!user) {
    // User not in system at all — send to registration
    const title = await getExhibitionTitleById(exhibitionId);
    await replyToLineMessage(
      replyToken,
      [
        buildRegistrationFlexMessage(
          "กรุณาลงทะเบียนก่อนเข้าร่วมนิทรรศการ",
          exhibitionId,
        ),
      ],
      config,
    );
    return;
  }

  // Check if registered for this exhibition
  const registration = await findRegistrationByUserAndExhibition(
    user.userId,
    exhibitionId,
  );

  if (!registration) {
    // Not registered for this exhibition — redirect to registration
    await replyToLineMessage(
      replyToken,
      [
        buildRegistrationFlexMessage(
          "คุณยังไม่ได้ลงทะเบียนสำหรับนิทรรศการนี้",
          exhibitionId,
        ),
      ],
      config,
    );
    return;
  }

  // Registered — switch rich menu based on role
  const richMenuId =
    registration.role === "staff" ? RICH_MENU_IDS.STAFF : RICH_MENU_IDS.MEMBER;

  try {
    await linkRichMenuToUser(userId, richMenuId, config);
    await setCurrentExhibition(userId, exhibitionId);
  } catch (err) {
    console.log("🚀 ~ handleEnterExhibition ~ err:", err);
    log.error({ err }, "Failed to link rich menu for exhibition entry");

    await replyToLineMessage(
      replyToken,
      [{ type: "text", text: "เกิดข้อผิดพลาดในการเข้าร่วมนิทรรศการ" }],
      config,
    );
    return;
  }

  const roleLabel = registration.role === "staff" ? " (Staff)" : "";
  const helpText = registration.role === "staff" ? staff_Help_text : HELP_TEXT;
  const liffExhibitionId = process.env.VITE_LIFF_EXHIBITION;

  const messages: LineMessage[] = [
    {
      type: "text",
      text: `กำลังเข้าสู่ ${registration.title}${roleLabel}`,
    },
    {
      type: "text",
      text: helpText,
    },
  ];

  if (liffExhibitionId) {
    messages.push({
      type: "template",
      altText: "ดูรายละเอียดนิทรรศการ",
      template: {
        type: "buttons",
        text: "คลิกเพื่อดูรายละเอียดนิทรรศการ",
        actions: [
          {
            type: "uri",
            label: "ดูรายละเอียดนิทรรศการ",
            uri: `https://liff.line.me/${liffExhibitionId}?exhibitionId=${exhibitionId}`,
          },
        ],
      },
    });
  }

  await replyToLineMessage(replyToken, messages, config);
}
