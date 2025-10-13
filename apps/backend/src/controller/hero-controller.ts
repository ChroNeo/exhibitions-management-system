import type { FastifyInstance, FastifyRequest } from "fastify";
import { getFeature } from "../queries/feature-query.js";

type FeatureRequestQuery = {
  limit?: string;
  status?: string;
};

export default function heroController(app: FastifyInstance) {
  app.get(
    "/",
    async (req: FastifyRequest<{ Querystring: FeatureRequestQuery }>) => {
      const { limit, status } = req.query ?? {};
      return await getFeature({ limit, status });
    }
  );
}
