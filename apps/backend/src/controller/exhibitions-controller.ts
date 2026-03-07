import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AppError } from "../errors.js";
import type { AddExhibitionPayload } from "../models/exhibition.model.js";
import {
  AddExhibitionPayloadSchema,
  CreateExhibitionSchema,
  ExhibitionSchema,
  UpdateExhibitionPayloadSchema,
  UpdateExhibitionSchema,
} from "../models/exhibition.model.js";
import {
  addExhibitions,
  deleteExhibition,
  getExhibitionById,
  getExhibitionsList,
  updateExhibition,
} from "../queries/exhibitions_query.js";
import { requireOrganizerAuth } from "../services/auth-middleware.js";
import {
  buildUpdatePayload,
  parseMultipartPayload,
} from "../services/exhibitions-payload-builder.js";
import { removeUploadedFile } from "../services/file-upload.js";

export default async function exhibitionsController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/",
    {
      schema: {
        tags: ["Exhibitions"],
        summary: "List exhibitions",
        response: {
          200: z.array(ExhibitionSchema),
        },
      },
    },
    async () => {
      return await getExhibitionsList();
    },
  );

  app.get(
    "/:id",
    {
      schema: {
        tags: ["Exhibitions"],
        summary: "Get exhibition",
        params: z.object({
          id: z.string().regex(/^\d+$/),
        }),
        response: {
          200: ExhibitionSchema,
        },
      },
    },
    async (req: FastifyRequest<{ Params: { id: string } }>) => {
      return await getExhibitionById(req.params.id);
    },
  );
  app.post(
    "/",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Exhibitions"],
        summary: "Create exhibition",
        body: z.union([CreateExhibitionSchema, z.any()]),
        response: {
          201: ExhibitionSchema,
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      // Extract user_id from JWT token
      if (!req.user) {
        throw new AppError("User not authenticated", 401, "UNAUTHORIZED");
      }
      const createdBy = Number(req.user.sub);

      const payload = req.isMultipart()
        ? await parseMultipartPayload(req, "create")
        : (req.body as Omit<AddExhibitionPayload, "created_by"> | undefined);

      if (!payload) {
        throw new AppError("request body is required", 400, "VALIDATION_ERROR");
      }

      // Add created_by from JWT token and validate with Zod
      const result = AddExhibitionPayloadSchema.safeParse({
        ...payload,
        created_by: createdBy,
      });
      if (!result.success) {
        throw new AppError(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          z.treeifyError(result.error),
        );
      }
      const exhibition = await addExhibitions(result.data);
      reply.code(201);
      return exhibition;
    },
  );

  app.put(
    "/:id",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Exhibitions"],
        summary: "Update exhibition",
        params: z.object({
          id: z.string().regex(/^\d+$/),
        }),
        body: z.union([UpdateExhibitionSchema, z.any()]),
        response: {
          200: ExhibitionSchema,
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };

      const existingExhibition = await getExhibitionById(id);
      const previousPicturePath = existingExhibition?.picture_path ?? null;
      const previousPdfPath = existingExhibition?.detail_pdf_url ?? null;

      const payload = req.isMultipart()
        ? await parseMultipartPayload(req, "update")
        : buildUpdatePayload(req.body);

      // Validate with Zod
      const result = UpdateExhibitionPayloadSchema.safeParse(payload);
      if (!result.success) {
        throw new AppError(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          z.treeifyError(result.error),
        );
      }

      const exhibition = await updateExhibition(id, result.data);

      // Delete old files if new ones were uploaded
      if (
        previousPicturePath &&
        previousPicturePath !== exhibition.picture_path
      ) {
        await removeUploadedFile(previousPicturePath, req.log);
      }
      if (previousPdfPath && previousPdfPath !== exhibition.detail_pdf_url) {
        await removeUploadedFile(previousPdfPath, req.log);
      }

      return exhibition;
    },
  );
  app.delete(
    "/:id",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Exhibitions"],
        summary: "Delete exhibition",
        params: z.object({
          id: z.string().regex(/^\d+$/),
        }),
        response: {
          204: z.null().describe("Exhibition deleted"),
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const existingExhibition = await getExhibitionById(id);
      await deleteExhibition(id);
      await Promise.all([
        removeUploadedFile(existingExhibition?.picture_path ?? null, req.log),
        removeUploadedFile(existingExhibition?.detail_pdf_url ?? null, req.log),
      ]);
      reply.code(204).send();
    },
  );
}
