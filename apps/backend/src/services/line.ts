import { createHmac } from "node:crypto";
import { AppError } from "../errors.js";

const LINE_API_BASE = "https://api.line.me/v2/bot";

export type LineConfig = {
  channelAccessToken: string;
  channelSecret: string;
};

type LineTemplateAction =
  | {
      type: "uri";
      label: string;
      uri: string;
    }
  | {
      type: "message";
      label: string;
      text: string;
    };

type LineTemplate =
  | {
      type: "buttons";
      text: string;
      actions: LineTemplateAction[];
    }
  | {
      type: "confirm";
      text: string;
      actions: LineTemplateAction[];
    };

export type LineMessage =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "template";
      altText: string;
      template: LineTemplate;
    };

export type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string | null;
};

type LineProfileResponse = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

export function getLineConfig(): LineConfig {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;

  if (!channelAccessToken || !channelSecret) {
    throw new AppError(
      "LINE channel credentials are not fully configured",
      500,
      "CONFIG_ERROR"
    );
  }

  return {
    channelAccessToken: channelAccessToken.trim(),
    channelSecret: channelSecret.trim(),
  };
}

export function verifyLineSignature(
  signature: string,
  rawBody: string | Buffer,
  config?: LineConfig
): boolean {
  const secret = (config ?? getLineConfig()).channelSecret;
  const bodyBuffer = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
  const computed = createHmac("sha256", secret).update(bodyBuffer).digest("base64");
  return computed === signature;
}

export async function fetchLineProfile(
  userId: string,
  config?: LineConfig
): Promise<LineProfile> {
  const { channelAccessToken } = config ?? getLineConfig();
  const response = await fetch(`${LINE_API_BASE}/profile/${encodeURIComponent(userId)}`, {
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError(
      `LINE profile fetch failed with status ${response.status}`,
      502,
      "LINE_API_ERROR",
      errorBody
    );
  }

  const payload = (await response.json()) as LineProfileResponse;
  return {
    userId: payload.userId,
    displayName: payload.displayName,
    pictureUrl: payload.pictureUrl ?? null,
  };
}

export async function replyToLineMessage(
  replyToken: string,
  messages: LineMessage[],
  config?: LineConfig
): Promise<void> {
  if (!messages.length) {
    return;
  }

  const { channelAccessToken } = config ?? getLineConfig();
  const response = await fetch(`${LINE_API_BASE}/message/reply`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError(
      `LINE reply failed with status ${response.status}`,
      502,
      "LINE_API_ERROR",
      errorBody
    );
  }
}
