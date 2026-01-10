import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyJwt, type JwtPayload } from "./jwt.js";
import { AppError } from "../errors.js";
import { verifyLiffIdToken } from "./line/security.js";
import { getUserRegistrationsByLineId, type UserRegistrationData } from "../queries/ticket-query.js";

// Extend Fastify request type to include user
declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
    lineUser?: UserRegistrationData;
  }
}

/**
 * Middleware to authenticate organizer users via JWT
 * Adds the decoded JWT payload to req.user
 */
export async function requireOrganizerAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AppError("Authorization header is required", 401, "UNAUTHORIZED");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new AppError(
      "Authorization header must be in format: Bearer <token>",
      401,
      "UNAUTHORIZED"
    );
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET;

  if (typeof secret !== "string" || !secret) {
    throw new AppError("JWT secret is not configured", 500, "CONFIG_ERROR");
  }

  const payload = verifyJwt(token, secret);

  // Ensure it's an organizer user
  if (payload.type !== "organizer") {
    throw new AppError(
      "This endpoint requires organizer authentication",
      403,
      "FORBIDDEN"
    );
  }

  // Attach user to request
  request.user = payload;
}

/**
 * Optional middleware that allows both authenticated and unauthenticated access
 * If a valid token is provided, req.user will be populated
 */
export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return; // No auth header, continue without user
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return; // Invalid format, continue without user
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET;

  if (typeof secret !== "string" || !secret) {
    return; // No secret configured, continue without user
  }

  try {
    const payload = verifyJwt(token, secret);
    request.user = payload;
  } catch {
    // Invalid token, continue without user
  }
}

/**
 * Middleware to authenticate LINE LIFF users
 * Verifies LIFF ID token and adds user data to req.lineUser
 */
export async function requireLiffAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AppError("Authorization header is required", 401, "MISSING_AUTH_HEADER");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new AppError(
      "Authorization header must be in format: Bearer <token>",
      401,
      "UNAUTHORIZED"
    );
  }

  const token = parts[1];

  // Verify LIFF ID token
  const verifiedToken = await verifyLiffIdToken(token);

  // Get user data from LINE ID
  const userData = await getUserRegistrationsByLineId(verifiedToken.sub);
  if (!userData) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  // Attach to request
  request.lineUser = userData;
}
