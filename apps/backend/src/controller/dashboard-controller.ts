import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { DashboardResponseSchema, OrgDashboardResponseSchema } from "../models/dashboard.model.js";
import { getStaffDashboard, getOrgDashboard, getStaffUnitByUserId } from "../queries/dashboard-query.js";
import { requireLiffAuth } from "../services/auth-middleware.js";

export default async function dashboardController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/staff/me",
    {
      preHandler: requireLiffAuth,
      schema: {
        tags: ["Dashboard"],
        summary: "Resolve ex_id and unit_id for the authenticated staff via LIFF",
        response: {
          200: z.object({
            status: z.literal("success"),
            data: z.object({
              ex_id: z.number(),
              unit_id: z.number(),
            }),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.lineUser!.user_id;
      const ids = await getStaffUnitByUserId(userId);
      return { status: "success" as const, data: ids };
    },
  );

  app.get(
    "/staff/:ex_id/:unit_id",
    {
      // onRequest: [requireLiffAuth],
      schema: {
        tags: ["Dashboard"],
        summary: "get the Staff Dashboard data",
        params: z.object({
          ex_id: z.coerce.number().int(),
          unit_id: z.coerce.number().int(),
        }),
        response: { 200: DashboardResponseSchema },
      },
    },
    async (request) => {
      const { ex_id, unit_id } = request.params;
      const result = await getStaffDashboard(ex_id, unit_id);
      return result;
    },
  );

  app.get(
    "/organizer/:id",
    {
      // onRequest: [requireLiffAuth],
      schema: {
        tags: ["Dashboard"],
        summary: "get the Organizer Dashboard data",
        params: z.object({ id: z.coerce.number().int() }),
        response: { 200: OrgDashboardResponseSchema },
      },
    },
    async (request) => {
      const result = await getOrgDashboard(request.params.id);
      return result;
    },
  );
}
