import { createHmac } from "node:crypto";
import { AppError } from "../errors.js";

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

export type SignJwtPayload = Record<string, unknown>;

export interface JwtPayload {
  sub: string; // user_id as string
  type: "organizer" | "normal";
  role: string;
  iat: number;
  exp: number;
}

export function signJwt(payload: SignJwtPayload, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" } as const;
  const encodedHeader = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = createHmac("sha256", secret)
    .update(signingInput)
    .digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${signingInput}.${encodedSignature}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new AppError("Invalid token format", 401, "INVALID_TOKEN");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // Verify signature
  const expectedSignature = createHmac("sha256", secret)
    .update(signingInput)
    .digest();
  const expectedEncodedSignature = base64UrlEncode(expectedSignature);

  if (encodedSignature !== expectedEncodedSignature) {
    throw new AppError("Invalid token signature", 401, "INVALID_TOKEN");
  }

  // Decode payload
  let payload: JwtPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    throw new AppError("Invalid token payload", 401, "INVALID_TOKEN");
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new AppError("Token has expired", 401, "TOKEN_EXPIRED");
  }

  return payload;
}
