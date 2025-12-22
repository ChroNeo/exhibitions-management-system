import { AppError } from "../../errors.js";
import { getLineConfig } from "./config.js";
import type { LineConfig, LineProfile, LineProfileResponse, LineMessage } from "./types.js";

const LINE_API_BASE = "https://api.line.me/v2/bot";

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

export async function linkRichMenuToUser(
  userId: string,
  richMenuId: string,
  config?: LineConfig
): Promise<void> {
  const { channelAccessToken } = config ?? getLineConfig();
  // API Endpoint: POST /v2/bot/user/{userId}/richmenu/{richMenuId}
  const response = await fetch(`${LINE_API_BASE}/user/${encodeURIComponent(userId)}/richmenu/${richMenuId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError(
      `Failed to link rich menu: ${response.status}`,
      502,
      "LINE_API_ERROR",
      errorBody
    );
  }
}

export async function unlinkRichMenuFromUser(
  userId: string,
  config?: LineConfig
): Promise<void> {
  const { channelAccessToken } = config ?? getLineConfig();
  // API Endpoint: DELETE /v2/bot/user/{userId}/richmenu
  const response = await fetch(`${LINE_API_BASE}/user/${encodeURIComponent(userId)}/richmenu`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError(
      `Failed to unlink rich menu: ${response.status}`,
      502,
      "LINE_API_ERROR",
      errorBody
    );
  }
}