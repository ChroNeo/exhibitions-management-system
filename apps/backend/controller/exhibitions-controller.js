import { getExhibitionsList, getExhibitionById } from "../queries/exhibitions.js";

export default async function exhibitionsRoutes(fastify, opts) {
  fastify.get("/", async () => {
    return await getExhibitionsList();
  });

  fastify.get("/:id", async (req) => {
    return await getExhibitionById(req.params.id);
  });
}
