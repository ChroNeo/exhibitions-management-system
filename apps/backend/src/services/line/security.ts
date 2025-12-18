import { createHmac } from "node:crypto";
import { AppError } from "../../errors.js";
import { getLineConfig } from "./config.js";
import type { LineConfig, VerifiedLiffToken, LineVerifyResponse } from "./types.js";

const LINE_OAUTH_BASE = "https://api.line.me/oauth2/v2.1";

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
