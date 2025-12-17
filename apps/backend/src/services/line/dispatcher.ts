import type { FastifyBaseLogger } from "fastify";
import {
  upsertLineUserProfile,
  markLineUserUnfollowed,
} from "../../queries/line-query.js";
import { fetchLineProfile, type LineConfig } from "../line.js";
import { handleFollowEvent } from "./handlers/follow-handler.js";
import { handleMessageCommand } from "./handlers/command-handler.js";


export type LineEvent = {
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

export async function dispatchLineEvent(
  event: LineEvent,
  config: LineConfig,
  log: FastifyBaseLogger
): Promise<void> {
  const sourceType = event.source?.type;
  const userId = event.source?.userId;

  // Handle unfollow event
  if (event.type === "unfollow" && userId) {
    await markLineUserUnfollowed(userId);
    return;
  }

  // Only process events from direct user sources
  if (sourceType !== "user" || !userId) {
    log.info({ sourceType }, "ignoring LINE event without direct user source");
    return;
  }

  // Sync user profile
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

  // Handle follow event
  if (event.type === "follow" && event.replyToken) {
    await handleFollowEvent(event.replyToken, config, log);
    return;
  }

  // Handle message event
  if (event.type === "message" && event.message?.type === "text" && event.replyToken) {
    const messageText = event.message.text ?? "";
    await handleMessageCommand(event.replyToken, messageText, config, log);
    return;
  }

  log.info({ type: event.type }, "LINE event type not handled");
}
