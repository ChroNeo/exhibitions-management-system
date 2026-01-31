import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AppError } from "../errors.js";
import { requireAdminAuth } from "../services/admin-middleware.js";
import {
  getAllOrganizerUsers,
  updateOrganizerUserRole,
  deleteOrganizerUser,
} from "../queries/admin-user-query.js";
import { createOrganizerUser } from "../queries/auth-query.js";
import {
  OrganizerUserListSchema,
  OrganizerUserSchema,
  UpdateRoleBody,
  UserIdParam,
} from "../models/admin-user.model.js";
import { RegisterSchema, UserResponseSchema } from "../models/auth.model.js";

export default async function adminController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /api/v1/admin/users — list all organizer users
  app.get(
    "/",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "List all organizer users",
        response: { 200: OrganizerUserListSchema },
      },
    },
    async () => {
      return getAllOrganizerUsers();
    }
  );

  // POST /api/v1/admin/users — create a new organizer/admin user
  app.post(
    "/",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "Create a new organizer or admin user",
        body: RegisterSchema,
        response: { 201: UserResponseSchema },
      },
    },
    async (req, reply) => {
      const { username, password, email = null, role = "organizer" } = req.body;

      const user = await createOrganizerUser({
        username: username.trim(),
        password,
        email: email ?? null,
        role,
      });

      reply.code(201);
      return user;
    }
  );

  // PATCH /api/v1/admin/users/:userId/role — update user role
  app.patch(
    "/:userId/role",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "Update user role",
        params: UserIdParam,
        body: UpdateRoleBody,
        response: { 200: OrganizerUserSchema },
      },
    },
    async (req) => {
      const { userId } = req.params;
      const { role } = req.body;
      return updateOrganizerUserRole(userId, role);
    }
  );

  // DELETE /api/v1/admin/users/:userId — delete a user
  app.delete(
    "/:userId",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "Delete an organizer user",
        params: UserIdParam,
        response: { 204: z.null().describe("User deleted") },
      },
    },
    async (req, reply) => {
      const { userId } = req.params;
      const currentUserId = Number(req.user?.sub);

      if (userId === currentUserId) {
        throw new AppError("Cannot delete your own account", 400, "SELF_DELETE");
      }

      await deleteOrganizerUser(userId);
      reply.code(204).send();
    }
  );
}
