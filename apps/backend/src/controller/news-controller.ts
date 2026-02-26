import path from "node:path";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { AppError } from "../errors.js";
import {
  AnnouncementSchema,
  AnnoucncementsPayload,
  UpdateAnnouncementPayload,
} from "../models/news.model.js";
import {
  getAnnouncementList,
  getAnnouncementListbyId,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
} from "../queries/news-query.js";
import { requireOrganizerAuth } from "../services/auth-middleware.js";
import { collectMultipartFields, removeUploadedFile } from "../services/file-upload.js";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const newsUploadsDir = path.resolve(__dirname, "../../uploads/news");

export default async function newsController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/",
    {
      schema: {
        tags: ["Announcements"],
        summary: "Get Announcements",
        response: {
          200: z.array(AnnouncementSchema),
        },
      },
    },
    async () => {
      return await getAnnouncementList();
    },
  );

  app.get(
    "/:id",
    {
      schema: {
        tags: ["Announcements"],
        summary: "Get Annoucncements by exhibition Id",
        params: z.object({ id: z.string().regex(/^\d+$/) }),
        response: {
          200: z.array(AnnouncementSchema),
        },
      },
    },
    async (req: FastifyRequest<{ Params: { id: string } }>) => {
      return await getAnnouncementListbyId(req.params.id);
    },
  );
  // Create Announcement
  app.post(
    "/",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Announcements"],
        summary: "Create Announcement",
        body: z.union([AnnoucncementsPayload, z.any()]),
        response: {
          201: z.object({
            message: z.string(),
            id: z.number(),
          }),
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      if (!req.user) {
        throw new AppError("User not authenticated", 401, "UNAUTHORIZED");
      }

      let payload;
      if (req.isMultipart()) {
        const { fields, files } = await collectMultipartFields(req, {
          fileFields: {
            image_url: {
              save: {
                targetDir: newsUploadsDir,
                publicPrefix: "uploads/news",
                fallbackName: "news_image",
                filenamePrefix: "NEWS",
              },
            },
          },
        });
        payload = AnnoucncementsPayload.parse({
          exhibition_id: Number(fields.exhibition_id),
          topic: fields.topic,
          description: fields.description || null,
          description_delta: fields.description_delta || null,
          image_url: files.image_url?.publicPath ?? null,
          is_active: fields.is_active ? Number(fields.is_active) : 1,
        });
      } else {
        payload = AnnoucncementsPayload.parse(req.body);
      }

      const result = await createAnnouncement(payload);
      return reply.status(201).send({
        message: "Announcement created",
        id: result.insertId,
      });
    },
  );
  // Update Announcement
  app.patch(
    "/:id",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Announcements"],
        summary: "Update Announcement",
        params: z.object({ id: z.string().regex(/^\d+$/) }),
        body: z.union([UpdateAnnouncementPayload, z.any()]),
        response: {
          200: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      if (!req.user) {
        throw new AppError("User not authenticated", 401, "UNAUTHORIZED");
      }
      const { id } = req.params as { id: string };

      let payload;
      if (req.isMultipart()) {
        const existing = await getAnnouncementById(id);
        const { fields, files } = await collectMultipartFields(req, {
          fileFields: {
            image_url: {
              save: {
                targetDir: newsUploadsDir,
                publicPrefix: "uploads/news",
                fallbackName: "news_image",
                filenamePrefix: "NEWS",
              },
            },
          },
        });

        const raw: Record<string, unknown> = {};
        if (fields.exhibition_id) raw.exhibition_id = Number(fields.exhibition_id);
        if (fields.topic) raw.topic = fields.topic;
        if (fields.description !== undefined) raw.description = fields.description || null;
        if (fields.description_delta !== undefined) raw.description_delta = fields.description_delta || null;
        if (fields.is_active) raw.is_active = Number(fields.is_active);
        if (files.image_url?.publicPath) {
          raw.image_url = files.image_url.publicPath;
          if (existing?.image_url) {
            await removeUploadedFile(existing.image_url, req.log);
          }
        }

        payload = UpdateAnnouncementPayload.parse(raw);
      } else {
        payload = UpdateAnnouncementPayload.parse(req.body);
      }

      await updateAnnouncement(id, payload);
      return reply.status(200).send({
        message: "Announcement updated",
      });
    },
  );
  // Delete Announcement (soft delete)
  app.delete(
    "/:id",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Announcements"],
        summary: "Delete Announcement",
        params: z.object({ id: z.string().regex(/^\d+$/) }),
        response: {
          200: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      if (!req.user) {
        throw new AppError("User not authenticated", 401, "UNAUTHORIZED");
      }
      const { id } = req.params as { id: string };
      await deleteAnnouncement(id);
      return reply.status(200).send({
        message: "Announcement deleted",
      });
    },
  );
}
