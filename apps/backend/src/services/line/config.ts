import { AppError } from "../../errors.js";
import type { LineConfig } from "./types.js";

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
