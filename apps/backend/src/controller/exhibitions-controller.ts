import {
  getExhibitionsList,
  getExhibitionById,
  addExhibitions,
  updateExhibition,
  deleteExhibition,
} from "../queries/exhibitions_query.js";
import type { AddExhibitionPayload } from "../models/exhibition_model.js";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors.js";
import { removeUploadedFile } from "../services/file-upload.js";
import {
  parseMultipartPayload,
  buildUpdatePayload,
} from "../services/exhibitions-payload-builder.js";

export default async function exhibitionsController(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Exhibitions"],
        summary: "List exhibitions",
        response: {
          200: {
            type: "array",
            items: { $ref: "Exhibition#" },
            example: [
              {
                exhibition_id: 42,
                exhibition_code: "EXH-042",
                title: "Tech Innovation Expo",
                description: "Annual technology showcase.",
                start_date: "2024-05-01T09:00:00Z",
                end_date: "2024-05-05T17:00:00Z",
                location: "Hall A, Bangkok Convention Centre",
                organizer_name: "Innovate Co.",
                picture_path: "uploads/exhibitions/exh-042.jpg",
                status: "published",
                created_by: 7,
              },
            ],
          },
        },
      },
    },
    async () => {
      return await getExhibitionsList();
    }
  );

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Exhibitions"],
        summary: "Get exhibition",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer", minimum: 1, example: 42 },
          },
        },
        response: {
          200: {
            $ref: "Exhibition#",
          },
        },
      },
    },
    async (req: FastifyRequest<{ Params: { id: string } }>) => {
      return await getExhibitionById(req.params.id);
    }
  );
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Exhibitions"],
        summary: "Create exhibition",
        body: { anyOf: [{ $ref: "CreateExhibitionInput#" }, { type: "null" }] },
        response: {
          201: {
            $ref: "Exhibition#",
          },
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const payload = req.isMultipart()
        ? await parseMultipartPayload(req, "create")
        : (req.body as AddExhibitionPayload | undefined);

      if (!payload) {
        throw new AppError("request body is required", 400, "VALIDATION_ERROR");
      }

      const exhibition = await addExhibitions(payload);
      reply.code(201);
      return exhibition;
    }
  );

  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Exhibitions"],
        summary: "Update exhibition",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer", minimum: 1, example: 42 },
          },
        },
        body: { anyOf: [{ $ref: "UpdateExhibitionInput#" }, { type: "null" }] },
        response: {
          200: {
            $ref: "Exhibition#",
          },
        },
      },
    },
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Body: Record<string, unknown> | undefined;
      }>
    ) => {
      const existingExhibition = await getExhibitionById(req.params.id);
      const previousPicturePath = existingExhibition?.picture_path ?? null;

      const payload = req.isMultipart()
        ? await parseMultipartPayload(req, "update")
        : buildUpdatePayload(req.body);

      const exhibition = await updateExhibition(req.params.id, payload);

      // Delete old file if a new one was uploaded
      if (previousPicturePath && previousPicturePath !== exhibition.picture_path) {
        await removeUploadedFile(previousPicturePath, req.log);
      }

      return exhibition;
    }
  );
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Exhibitions"],
        summary: "Delete exhibition",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer", minimum: 1, example: 42 },
          },
        },
        response: {
          204: {
            description: "Exhibition deleted",
          },
        },
      },
    },
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      await deleteExhibition(req.params.id);
      reply.code(204).send();
    }
  );
}
