import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAdminAuth } from "../services/admin-middleware.js";
import {
  getVisitors,
  getVisitorById,
  getVisitorExhibitions,
  getExhibitionUnitsWithCheckin,
  toggleCheckin,
} from "../queries/admin-visitor-query.js";
import {
  VisitorListSchema,
  VisitorDetailSchema,
  VisitorExhibitionListSchema,
  CheckinRecordListSchema,
  UserIdParam,
  UserExhibitionParams,
  ToggleCheckinBody,
  ToggleCheckinResponse,
} from "../models/admin-visitor.model.js";
import { AppError } from "../errors.js";

export default async function adminVisitorController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // List all visitors (normal_users with role user/staff)
  app.get(
    "/",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "List all visitors",
        response: { 200: VisitorListSchema },
      },
    },
    async () => {
      return getVisitors();
    }
  );

  // Get visitor detail
  app.get(
    "/:userId",
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

  // Get exhibitions a visitor is registered for (with check-in progress)
  app.get(
    "/:userId/exhibitions",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "List exhibitions for a visitor with check-in progress",
        params: UserIdParam,
        response: { 200: VisitorExhibitionListSchema },
      },
    },
    async (req) => {
      return getVisitorExhibitions(req.params.userId);
    }
  );

  // Get units with check-in status for a visitor in an exhibition
  app.get(
    "/:userId/exhibitions/:exhibitionId/checkins",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "Get check-in status per unit for a visitor in an exhibition",
        params: UserExhibitionParams,
      },
    },
    async (req) => {
      return getExhibitionUnitsWithCheckin(req.params.userId, req.params.exhibitionId);
    }
  );

  // Toggle check-in for a visitor at a unit
  app.post(
    "/:userId/exhibitions/:exhibitionId/checkins/toggle",
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
