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
} from "../queries/news-query.js";
import { requireOrganizerAuth } from "../services/auth-middleware.js";

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
        body: AnnoucncementsPayload,
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
      const payload = AnnoucncementsPayload.parse(req.body);
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
        body: UpdateAnnouncementPayload,
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
      const payload = UpdateAnnouncementPayload.parse(req.body);
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
