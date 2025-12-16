import { createHmac } from "node:crypto";
import { AppError } from "../errors.js";

const LINE_API_BASE = "https://api.line.me/v2/bot";
const LINE_OAUTH_BASE = "https://api.line.me/oauth2/v2.1";

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

export type VerifiedLiffToken = {
  sub: string;
  name?: string;
  picture?: string;
  email?: string;
};

type LineVerifyResponse = {
  client_id: string;
  expires_in: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

/**
 * Verifies a LINE LIFF ID token by calling LINE's verify endpoint.
 * Returns the token payload with the user's LINE User ID (sub).
 * @param idToken - The LINE LIFF ID token from liff.getIDToken()
 * @throws {AppError} If token is invalid, expired, or verification fails
 */
export async function verifyLiffIdToken(idToken: string): Promise<VerifiedLiffToken> {
  if (!idToken?.trim()) {
    throw new AppError("ID token is required", 401, "MISSING_TOKEN");
  }

  // Decode the JWT payload to extract user information first
  // The ID token is a JWT in format: header.payload.signature
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new AppError("Invalid token format", 401, "INVALID_TOKEN");
  }

  let payload: VerifiedLiffToken & { exp?: number; aud?: string };
  try {
    const payloadBase64 = parts[1];
    const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf-8");
    payload = JSON.parse(payloadJson);

    if (!payload.sub) {
      throw new AppError("Token missing user ID", 401, "INVALID_TOKEN");
    }

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new AppError("Token has expired", 401, "TOKEN_EXPIRED");
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to decode token payload", 401, "INVALID_TOKEN");
  }

  // Verify token with LINE API using POST method
  // Reference: https://developers.line.biz/en/reference/line-login/#verify-id-token
  const formData = new URLSearchParams();
  formData.append("id_token", idToken);
  formData.append("client_id", payload.aud || "");

  const response = await fetch(`${LINE_OAUTH_BASE}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new AppError(
      `LINE token verification failed with status ${response.status}: ${errorText}`,
      401,
      "TOKEN_VERIFICATION_FAILED"
    );
  }

  const data = (await response.json()) as LineVerifyResponse;

  if (data.error) {
    throw new AppError(
      data.error_description || "Invalid or expired token",
      401,
      "INVALID_TOKEN"
    );
  }

  return {
    sub: payload.sub,
    name: payload.name,
    picture: payload.picture,
    email: payload.email,
  };
}
