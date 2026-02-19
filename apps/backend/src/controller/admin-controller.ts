import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AppError } from "../errors.js";
import { requireAdminAuth } from "../services/admin-middleware.js";

import { createOrganizerUser } from "../queries/auth-query.js";
import {
  getAllOrganizerUsers,
  updateOrganizerUserRole,
  deleteOrganizerUser,
  getExhibitionsWithStats,
  getRegistrationsByExhibition,
  getVisitors,
  getVisitorById,
  getVisitorExhibitions,
  getExhibitionUnitsWithCheckin,
  toggleCheckin,
} from "../queries/admin-query.js";
import { RegisterSchema, UserResponseSchema } from "../models/auth.model.js";
import {
  OrganizerUserListSchema,
  OrganizerUserSchema,
  UpdateRoleBody,
  UserIdParam,
  ExhibitionWithStatsListSchema,
  RegistrationListSchema,
  ExhibitionIdParam,
  VisitorListSchema,
  VisitorDetailSchema,
  VisitorExhibitionListSchema,
  UserExhibitionParams,
  ToggleCheckinBody,
  ToggleCheckinResponse,
} from "../models/admin.model.js";

export default async function adminController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // ------------------------------------------------------------------ //
  //  USERS  — /api/v1/admin/users
  // ------------------------------------------------------------------ //

  // GET /api/v1/admin/users — list all organizer users
  app.get(
    "/users",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "List all organizer users",
        response: { 200: OrganizerUserListSchema },
      },
    },
    async () => getAllOrganizerUsers()
  );

  // POST /api/v1/admin/users — create a new organizer/admin user
  app.post(
    "/users",
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
    "/users/:userId/role",
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
    "/users/:userId",
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

  // ------------------------------------------------------------------ //
  //  DASHBOARD  — /api/v1/admin/dashboard
  // ------------------------------------------------------------------ //

  // GET /api/v1/admin/dashboard/exhibitions
  app.get(
    "/dashboard/exhibitions",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "List exhibitions with registration stats",
        response: { 200: ExhibitionWithStatsListSchema },
      },
    },
    async () => getExhibitionsWithStats()
  );

  // GET /api/v1/admin/dashboard/exhibitions/:exhibitionId/registrations
  app.get(
    "/dashboard/exhibitions/:exhibitionId/registrations",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "List registrations for an exhibition",
        params: ExhibitionIdParam,
        response: { 200: RegistrationListSchema },
      },
    },
    async (req) => {
      const { exhibitionId } = req.params;
      return getRegistrationsByExhibition(exhibitionId);
    }
  );

  // ------------------------------------------------------------------ //
  //  VISITORS  — /api/v1/admin/visitors
  // ------------------------------------------------------------------ //

  // GET /api/v1/admin/visitors
  app.get(
    "/visitors",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "List all visitors",
        response: { 200: VisitorListSchema },
      },
    },
    async () => getVisitors()
  );

  // GET /api/v1/admin/visitors/:userId
  app.get(
    "/visitors/:userId",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "Get visitor detail",
        params: UserIdParam,
        response: { 200: VisitorDetailSchema },
      },
    },
    async (req) => {
      const visitor = await getVisitorById(req.params.userId);
      if (!visitor) throw new AppError("Visitor not found", 404, "NOT_FOUND");
      return visitor;
    }
  );

  // GET /api/v1/admin/visitors/:userId/exhibitions
  app.get(
    "/visitors/:userId/exhibitions",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "List exhibitions for a visitor with check-in progress",
        params: UserIdParam,
        response: { 200: VisitorExhibitionListSchema },
      },
    },
    async (req) => getVisitorExhibitions(req.params.userId)
  );

  // GET /api/v1/admin/visitors/:userId/exhibitions/:exhibitionId/checkins
  app.get(
    "/visitors/:userId/exhibitions/:exhibitionId/checkins",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "Get check-in status per unit for a visitor in an exhibition",
        params: UserExhibitionParams,
      },
    },
    async (req) =>
      getExhibitionUnitsWithCheckin(req.params.userId, req.params.exhibitionId)
  );

  // POST /api/v1/admin/visitors/:userId/exhibitions/:exhibitionId/checkins/toggle
  app.post(
    "/visitors/:userId/exhibitions/:exhibitionId/checkins/toggle",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "Toggle check-in for a visitor at a specific unit",
        params: UserExhibitionParams,
        body: ToggleCheckinBody,
        response: { 200: ToggleCheckinResponse },
      },
    },
    async (req) => {
      const { userId, exhibitionId } = req.params;
      const { unit_id } = req.body;
      return toggleCheckin(userId, exhibitionId, unit_id);
    }
  );
}
