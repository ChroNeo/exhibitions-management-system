import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { DashboardResponseSchema, OrgDashboardResponseSchema } from "../models/dashboard.model.js";
import { getStaffDashboard, getOrgDashboard } from "../queries/dashboard-query.js";

export default async function dashboardController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.get(
    "/staff/:id",
    {
      // onRequest: [requireLiffAuth],
      schema: {
        tags: ["Dashboard"],
        summary: "get the Staff Dashbaord data",
        params: z.object({ id: z.coerce.number().int() }),
        response: { 200: DashboardResponseSchema },
      },
    },
    async (request) => {
      const result = await getStaffDashboard(request.params.id);
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
