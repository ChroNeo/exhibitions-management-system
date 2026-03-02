import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { DashboardResponseSchema, OrgDashboardResponseSchema } from "../models/dashboard.model.js";
import { getStaffDashboard, getOrgDashboard } from "../queries/dashboard-query.js";

export default async function dashboardController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
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
