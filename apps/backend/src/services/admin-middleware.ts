import type { FastifyRequest, FastifyReply } from "fastify";
import { requireOrganizerAuth } from "./auth-middleware.js";
import { AppError } from "../errors.js";

/**
 * Middleware that requires admin role.
 * First validates organizer JWT, then checks role === "admin".
 */
export async function requireAdminAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await requireOrganizerAuth(request, reply);

  if (request.user?.role !== "admin") {
    throw new AppError("Admin access required", 403, "FORBIDDEN");
  }
}
