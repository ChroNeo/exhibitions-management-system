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
export default async function unitsController(fastify: FastifyInstance) {
  await fastify.register(
    async (fastify) => {
      fastify.get(
        "/units",
        {
          schema: {
            tags: ["Units"],
            summary: "List units by exhibition",
            params: {
              type: "object",
              required: ["ex_id"],
              properties: {
                ex_id: { type: "integer", minimum: 1, example: 42 },
              },
            },
            response: {
              200: {
                type: "array",
                items: { $ref: "Unit#" },
                example: [
                  {
                    unit_id: 105,
                    exhibition_id: 42,
                    unit_name: "AI Playground",
                    unit_type: "booth",
                    description: "Interactive demos of AI gadgets.",
                    staff_user_id: 13,
                    staff_name: "คุณสมชาย",
                    staff_user_ids: [13, 21],
                    staff_names: ["คุณสมชาย", "คุณสายฝน"],
                    poster_url: "uploads/units/ai-playground.png",
                    starts_at: "2024-05-01T10:00:00Z",
                    ends_at: "2024-05-01T18:00:00Z",
                  },
                ],
              },
            },
          },
        },
        async (req: FastifyRequest<{ Params: { ex_id: string } }>) => {
          return await getUnitsByExhibitionId(req.params.ex_id);
        }
      );

      fastify.get(
        "/units/:id",
        {
          schema: {
            tags: ["Units"],
            summary: "Get unit",
            params: {
              type: "object",
              required: ["ex_id", "id"],
              properties: {
                ex_id: { type: "integer", minimum: 1, example: 42 },
                id: { type: "integer", minimum: 1, example: 105 },
              },
            },
            response: {
              200: {
                type: "array",
                items: { $ref: "Unit#" },
                example: [
                  {
                    unit_id: 105,
                    exhibition_id: 42,
                    unit_name: "AI Playground",
                    unit_type: "booth",
                    description: "Interactive demos of AI gadgets.",
                    staff_user_id: 13,
                    staff_name: "คุณสมชาย",
                    staff_user_ids: [13, 21],
                    staff_names: ["คุณสมชาย", "คุณสายฝน"],
                    poster_url: "uploads/units/ai-playground.png",
                    starts_at: "2024-05-01T10:00:00Z",
                    ends_at: "2024-05-01T18:00:00Z",
                  },
                ],
              },
            },
          },
        },
        async (req: FastifyRequest<{ Params: { ex_id: string; id: string } }>) => {
          return await getUnitsById(req.params.ex_id, req.params.id);
        }
      );

      fastify.post(
        "/units",
        {
          attachValidation: true,
          schema: {
            tags: ["Units"],
            summary: "Create unit",
            params: {
              type: "object",
              required: ["ex_id"],
              properties: {
                ex_id: { type: "integer", minimum: 1, example: 42 },
              },
            },
            body: { $ref: "CreateUnitInput#" },
            response: {
              201: {
                $ref: "Unit#",
              },
            },
          },
        },
        async (
          req: FastifyRequest<{
            Params: { ex_id: string };
            Body: unknown;
          }>,
          reply: FastifyReply
        ) => {
          if (req.validationError && !req.isMultipart()) {
            throw req.validationError;
          }
          const payload = req.isMultipart()
            ? await parseMultipartPayload(req)
            : buildCreatePayload(req.params.ex_id, req.body);

          const unit = await addUnit(payload);
          reply.code(201);
          return unit;
        }
      );

      fastify.put(
        "/units/:id",
        {
          attachValidation: true,
          schema: {
            tags: ["Units"],
            summary: "Update unit",
            params: {
              type: "object",
              required: ["ex_id", "id"],
              properties: {
                ex_id: { type: "integer", minimum: 1, example: 42 },
                id: { type: "integer", minimum: 1, example: 105 },
              },
            },
            body: { $ref: "UpdateUnitInput#" },
            response: {
              200: {
                $ref: "Unit#",
              },
            },
          },
        },
        async (
          req: FastifyRequest<{
            Params: { ex_id: string; id: string };
            Body: unknown;
          }>,
          reply: FastifyReply
        ) => {
          if (req.validationError && !req.isMultipart()) {
            throw req.validationError;
          }

          const { ex_id, id } = req.params;
          const [existingUnit] = await getUnitsById(ex_id, id);
          const previousPdfPath = existingUnit?.detail_pdf_url ?? null;
          const previousPosterPath = existingUnit?.poster_url ?? null;

          const payload = req.isMultipart()
            ? await parseMultipartUpdatePayload(req)
            : buildUpdatePayload(req.body);

          const unit = await updateUnit(req.params.ex_id, req.params.id, payload);
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

      fastify.delete(
        "/units/:id",
        {
          schema: {
            tags: ["Units"],
            summary: "Delete unit",
            params: {
              type: "object",
              required: ["ex_id", "id"],
              properties: {
                ex_id: { type: "integer", minimum: 1, example: 42 },
                id: { type: "integer", minimum: 1, example: 105 },
              },
            },
            response: {
              204: {
                type: "null",
                description: "Unit deleted",
              },
            },
          },
        },
        async (req: FastifyRequest<{ Params: { ex_id: string; id: string } }>, reply: FastifyReply) => {
          const { ex_id, id } = req.params;
          const [existingUnit] = await getUnitsById(ex_id, id);
          await deleteUnit(ex_id, id);
          await Promise.all([
            removeUploadedFile(existingUnit?.poster_url ?? null, req.log),
            removeUploadedFile(existingUnit?.detail_pdf_url ?? null, req.log),
          ]);
          reply.code(204);
        }
      );
    },
    { prefix: "/:ex_id" }
  );
}
