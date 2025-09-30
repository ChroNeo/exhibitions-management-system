import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors.js";
import { getUnitsByExhibitionId, getUnitsById } from "../queries/units-query.js";
export default function unitsController(fastify: FastifyInstance) {
      fastify.get("/:ex_id/units", async (req: FastifyRequest<{ Params: { ex_id: string } }>) => {
            return await getUnitsByExhibitionId(req.params.ex_id);
      })
      fastify.get(
            "/:ex_id/units/:id", async (req: FastifyRequest<{ Params: { ex_id: string, id: string } }>) => {
                  return await getUnitsById(req.params.ex_id, req.params.id);
            }
      );
};