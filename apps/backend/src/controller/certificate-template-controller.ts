import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  getCertificateTemplateByExhibitionId,
  createCertificateTemplate,
  updateCertificateTemplate,
  deleteCertificateTemplate,
} from "../queries/certificate-template-query.js";
import {
  CertificateTemplateViewSchema,
  type LayoutConfig,
} from "../models/certificate-template.model.js";
import { requireOrganizerAuth } from "../services/auth-middleware.js";
import { collectMultipartFields } from "../services/file-upload.js";
import { parseJsonField } from "../utils/validation.js";
import { AppError } from "../errors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const certificatesDir = path.resolve(__dirname, "../../uploads/certificates/templates");

export default async function certificateTemplateController(
  fastify: FastifyInstance
) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /exhibitions/:exhibitionId/certificate-template
  app.get(
    "/:exhibitionId/certificate-template",
    {
      schema: {
        tags: ["Exhibitions"],
        summary: "Get certificate template for exhibition",
        params: z.object({
          exhibitionId: z.string().regex(/^\d+$/),
        }),
        response: {
          200: CertificateTemplateViewSchema,
          404: z.object({
            message: z.string(),
            status: z.number(),
            code: z.string(),
          }),
        },
      },
    },
    async (req, reply) => {
      const { exhibitionId } = req.params;
      const template = await getCertificateTemplateByExhibitionId(exhibitionId);

      if (!template) {
        return reply.status(404).send({
          message: "certificate template not found",
          status: 404,
          code: "NOT_FOUND",
        });
      }

      return template;
    }
  );

  // POST /exhibitions/:exhibitionId/certificate-template
  // Supports multipart/form-data with file upload
  app.post(
    "/:exhibitionId/certificate-template",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Exhibitions"],
        summary: "Create certificate template for exhibition (with file upload)",
        description: "Upload background image/PDF for certificate template. Use multipart/form-data with 'file' field for the background and optional 'layout_config' JSON field.",
        params: z.object({
          exhibitionId: z.string().regex(/^\d+$/),
        }),
        consumes: ["multipart/form-data"],
        response: {
          201: CertificateTemplateViewSchema,
        },
      },
    },
    async (req, reply) => {
      const { exhibitionId } = req.params;

      const { fields, files } = await collectMultipartFields(req, {
        fileFields: {
          file: {
            save: {
              targetDir: certificatesDir,
              publicPrefix: "uploads/certificates/templates",
              fallbackName: "certificate_bg",
              filenamePrefix: "EX_C",
            },
          },
        },
      });

      const backgroundUrl = files.file?.publicPath;
      if (!backgroundUrl) {
        throw new AppError("file is required", 400, "VALIDATION_ERROR");
      }

      let layoutConfig: LayoutConfig | undefined;
      if (fields.layout_config) {
        const jsonStr = parseJsonField(fields.layout_config, "layout_config");
        if (jsonStr) {
          layoutConfig = JSON.parse(jsonStr) as LayoutConfig;
        }
      }

      const template = await createCertificateTemplate(exhibitionId, {
        background_url: backgroundUrl,
        layout_config: layoutConfig,
      });

      reply.code(201);
      return template;
    }
  );

  // PUT /exhibitions/:exhibitionId/certificate-template
  // Supports multipart/form-data with optional file upload
  app.put(
    "/:exhibitionId/certificate-template",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Exhibitions"],
        summary: "Update certificate template for exhibition (with optional file upload)",
        description: "Update certificate template. Use multipart/form-data with optional 'file' field for new background and/or 'layout_config' JSON field.",
        params: z.object({
          exhibitionId: z.string().regex(/^\d+$/),
        }),
        consumes: ["multipart/form-data"],
        response: {
          200: CertificateTemplateViewSchema,
        },
      },
    },
    async (req, reply) => {
      const { exhibitionId } = req.params;

      const { fields, files } = await collectMultipartFields(req, {
        fileFields: {
          file: {
            save: {
              targetDir: certificatesDir,
              publicPrefix: "uploads/certificates/templates",
              fallbackName: "certificate_bg",
              filenamePrefix: "EX_C",
            },
          },
        },
      });

      const payload: { background_url?: string; layout_config?: LayoutConfig } = {};

      // Handle file upload if provided
      const backgroundUrl = files.file?.publicPath;
      if (backgroundUrl) {
        payload.background_url = backgroundUrl;
      }

      // Handle layout_config if provided
      if (fields.layout_config) {
        const jsonStr = parseJsonField(fields.layout_config, "layout_config");
        if (jsonStr) {
          payload.layout_config = JSON.parse(jsonStr) as LayoutConfig;
        }
      }

      // Ensure at least one field is being updated
      if (!payload.background_url && !payload.layout_config) {
        throw new AppError("no fields to update (provide file or layout_config)", 400, "VALIDATION_ERROR");
      }

      const template = await updateCertificateTemplate(exhibitionId, payload);
      return template;
    }
  );

  // DELETE /exhibitions/:exhibitionId/certificate-template
  app.delete(
    "/:exhibitionId/certificate-template",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Exhibitions"],
        summary: "Delete certificate template for exhibition",
        params: z.object({
          exhibitionId: z.string().regex(/^\d+$/),
        }),
        response: {
          204: z.null().describe("Certificate template deleted"),
        },
      },
    },
    async (req, reply) => {
      const { exhibitionId } = req.params;
      await deleteCertificateTemplate(exhibitionId);
      reply.code(204).send();
    }
  );
}
