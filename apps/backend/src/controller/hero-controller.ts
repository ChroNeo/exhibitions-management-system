import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { getFeature } from "../queries/feature-query.js";
import {
  FeatureQuerySchema,
  FeatureResponseSchema,
  type FeatureQuery,
} from "../models/feature.model.js";

export default async function heroController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/",
    {
      schema: {
        tags: ["Hero"],
        summary: "Get featured exhibitions for hero section",
        querystring: FeatureQuerySchema,
        response: {
          200: FeatureResponseSchema,
        },
      },
    },
    async (req: FastifyRequest<{ Querystring: FeatureQuery }>) => {
      const { limit, status } = req.query ?? {};
      return await getFeature({ limit, status });
    }
  );
}
