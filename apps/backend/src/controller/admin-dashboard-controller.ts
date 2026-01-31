import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAdminAuth } from "../services/admin-middleware.js";
import {
  getExhibitionsWithStats,
  getRegistrationsByExhibition,
} from "../queries/admin-dashboard-query.js";
import {
  ExhibitionWithStatsListSchema,
  RegistrationListSchema,
  ExhibitionIdParam,
} from "../models/admin-dashboard.model.js";

export default async function adminDashboardController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/exhibitions",
    {
      onRequest: [requireAdminAuth],
      schema: {
        tags: ["Admin"],
        summary: "List exhibitions with registration stats",
        response: { 200: ExhibitionWithStatsListSchema },
      },
    },
    async () => {
      return getExhibitionsWithStats();
    }
  );

  app.get(
    "/exhibitions/:exhibitionId/registrations",
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
}
