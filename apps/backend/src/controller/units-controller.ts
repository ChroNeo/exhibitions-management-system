import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { addUnit, deleteUnit, getUnitsByExhibitionId, getUnitsById, updateUnit } from "../queries/units-query.js";
import { removeUploadedFile } from "../services/file-upload.js";
import {
  parseMultipartPayload,
  buildCreatePayload,
  parseMultipartUpdatePayload,
  buildUpdatePayload,
} from "../services/units-payload-builder.js";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { CreateUnitSchema, UpdateUnitSchema, UnitSchema } from "../models/unit.model.js";
import { requireOrganizerAuth } from "../services/auth-middleware.js";

export default async function unitsController(fastify: FastifyInstance) {
  await fastify.register(
    async (fastify) => {
      const app = fastify.withTypeProvider<ZodTypeProvider>();

      app.get(
        "/units",
        {
          schema: {
            tags: ["Units"],
            summary: "List units by exhibition",
            params: z.object({
              ex_id: z.string().regex(/^\d+$/),
            }),
            response: {
              200: z.array(UnitSchema),
            },
          },
        },
        async (req: FastifyRequest<{ Params: { ex_id: string } }>) => {
          return await getUnitsByExhibitionId(req.params.ex_id);
        }
      );

      app.get(
        "/units/:id",
        {
          schema: {
            tags: ["Units"],
            summary: "Get unit",
            params: z.object({
              ex_id: z.string().regex(/^\d+$/),
              id: z.string().regex(/^\d+$/),
            }),
            response: {
              200: z.array(UnitSchema),
            },
          },
        },
        async (req: FastifyRequest<{ Params: { ex_id: string; id: string } }>) => {
          return await getUnitsById(req.params.ex_id, req.params.id);
        }
      );

      app.post(
        "/units",
        {
          preHandler: requireOrganizerAuth,
          schema: {
            tags: ["Units"],
            summary: "Create unit",
            params: z.object({
              ex_id: z.string().regex(/^\d+$/),
            }),
            body: z.union([CreateUnitSchema, z.any()]),
            response: {
              201: UnitSchema,
            },
          },
        },
        async (req: FastifyRequest, reply: FastifyReply) => {
          const { ex_id } = req.params as { ex_id: string };

          const payload = req.isMultipart()
            ? await parseMultipartPayload(req as FastifyRequest<{ Params: { ex_id: string } }>)
            : buildCreatePayload(ex_id, req.body);

          const unit = await addUnit(payload);
          reply.code(201);
          return unit;
        }
      );

      app.put(
        "/units/:id",
        {
          preHandler: requireOrganizerAuth,
          schema: {
            tags: ["Units"],
            summary: "Update unit",
            params: z.object({
              ex_id: z.string().regex(/^\d+$/),
              id: z.string().regex(/^\d+$/),
            }),
            body: z.union([UpdateUnitSchema, z.any()]),
            response: {
              200: UnitSchema,
            },
          },
        },
        async (req: FastifyRequest, reply: FastifyReply) => {
          const { ex_id, id } = req.params as { ex_id: string; id: string };
          const [existingUnit] = await getUnitsById(ex_id, id);
          const previousPdfPath = existingUnit?.detail_pdf_url ?? null;
          const previousPosterPath = existingUnit?.poster_url ?? null;

          const payload = req.isMultipart()
            ? await parseMultipartUpdatePayload(req as FastifyRequest<{ Params: { ex_id: string; id: string } }>)
            : buildUpdatePayload(req.body);

          const unit = await updateUnit(ex_id, id, payload);
          if (previousPdfPath && previousPdfPath !== unit.detail_pdf_url) {
            await removeUploadedFile(previousPdfPath, req.log);
          }
          if (previousPosterPath && previousPosterPath !== unit.poster_url) {
            await removeUploadedFile(previousPosterPath, req.log);
          }
          reply.code(200);
          return unit;
        }
      );

      app.delete(
        "/units/:id",
        {
          preHandler: requireOrganizerAuth,
          schema: {
            tags: ["Units"],
            summary: "Delete unit",
            params: z.object({
              ex_id: z.string().regex(/^\d+$/),
              id: z.string().regex(/^\d+$/),
            }),
            response: {
              204: z.null().describe("Unit deleted"),
            },
          },
        },
        async (req: FastifyRequest, reply: FastifyReply) => {
          const { ex_id, id } = req.params as { ex_id: string; id: string };
          const [existingUnit] = await getUnitsById(ex_id, id);
          await deleteUnit(ex_id, id);
          await Promise.all([
            removeUploadedFile(existingUnit?.poster_url ?? null, req.log),
            removeUploadedFile(existingUnit?.detail_pdf_url ?? null, req.log),
          ]);
          reply.code(204).send();
        }
      );
    },
    { prefix: "/:ex_id" }
  );
}
