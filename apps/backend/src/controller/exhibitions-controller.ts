import { getExhibitionsList, getExhibitionById } from "../queries/exhibitions.js";
import type { FastifyInstance, FastifyRequest } from "fastify";

export default async function exhibitionsRoutes(fastify: FastifyInstance) {
  fastify.get("/", async () => {
    return await getExhibitionsList();
  });

  fastify.get(
    "/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>) => {
      return await getExhibitionById(req.params.id);
    }
  );
}
