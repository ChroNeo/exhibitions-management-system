import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { AppError } from "../errors.js";
import {
  CertificateDownloadErrorResponseSchema,
  CertificateDownloadQuerySchema,
  CertificateErrorResponseSchema,
  CertificatePreviewResponseSchema,
  CertificateTemplateViewSchema,
  CertificateUserParamsSchema,
  ExhibitionIdParamSchema,
  type LayoutConfig,
} from "../models/certificate-template.model.js";
import {
  createCertificateTemplate,
  deleteCertificateTemplate,
  getCertificateTemplateByExhibitionId,
  getRegisteredParticipantName,
  getUserCheckinCompletionStatus,
  updateCertificateTemplate,
} from "../queries/certificate-template-query.js";
import {
  requireLiffAuth,
  requireOrganizerAuth,
} from "../services/auth-middleware.js";
import { generateCertificate } from "../services/certificate-generator.js";
import {
  collectMultipartFields,
  removeUploadedFile,
} from "../services/file-upload.js";
import { parseJsonField } from "../utils/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const certificatesDir = path.resolve(
  __dirname,
  "../../uploads/certificates/templates",
);

export default async function certificateTemplateController(
  fastify: FastifyInstance,
) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // GET /exhibitions/:exhibitionId/certificate-template
  app.get(
    "/:exhibitionId/certificate-template",
    {
      schema: {
        tags: ["Certificate"],
        summary: "Get certificate template for exhibition",
        params: ExhibitionIdParamSchema,
        response: {
          200: CertificateTemplateViewSchema,
          404: CertificateErrorResponseSchema,
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
    },
  );

  // POST /exhibitions/:exhibitionId/certificate-template
  // Supports multipart/form-data with file upload
  app.post(
    "/:exhibitionId/certificate-template",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Certificate"],
        summary:
          "Create certificate template for exhibition (with file upload)",
        description:
          "Upload background image/PDF for certificate template. Use multipart/form-data with 'file' field for the background and optional 'layout_config' JSON field.",
        params: ExhibitionIdParamSchema,
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
    },
  );

  // PUT /exhibitions/:exhibitionId/certificate-template
  // Supports multipart/form-data with optional file upload
  app.put(
    "/:exhibitionId/certificate-template",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Certificate"],
        summary:
          "Update certificate template for exhibition (with optional file upload)",
        description:
          "Update certificate template. Use multipart/form-data with optional 'file' field for new background and/or 'layout_config' JSON field.",
        params: ExhibitionIdParamSchema,
        consumes: ["multipart/form-data"],
        response: {
          200: CertificateTemplateViewSchema,
        },
      },
    },
    async (req, reply) => {
      const { exhibitionId } = req.params;

      // Get existing template to check for old file
      const existingTemplate =
        await getCertificateTemplateByExhibitionId(exhibitionId);

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

      const payload: { background_url?: string; layout_config?: LayoutConfig } =
        {};

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
        throw new AppError(
          "no fields to update (provide file or layout_config)",
          400,
          "VALIDATION_ERROR",
        );
      }

      const template = await updateCertificateTemplate(exhibitionId, payload);

      // Delete old file if a new one was uploaded
      if (backgroundUrl && existingTemplate?.background_url) {
        await removeUploadedFile(existingTemplate.background_url, req.log);
      }

      return template;
    },
  );

  // DELETE /exhibitions/:exhibitionId/certificate-template
  app.delete(
    "/:exhibitionId/certificate-template",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Certificate"],
        summary: "Delete certificate template for exhibition",
        params: ExhibitionIdParamSchema,
        response: {
          204: z.null().describe("Certificate template deleted"),
        },
      },
    },
    async (req, reply) => {
      const { exhibitionId } = req.params;

      // Get existing template to delete the file
      const existingTemplate =
        await getCertificateTemplateByExhibitionId(exhibitionId);

      await deleteCertificateTemplate(exhibitionId);

      // Delete the file from disk
      if (existingTemplate?.background_url) {
        await removeUploadedFile(existingTemplate.background_url, req.log);
      }

      reply.code(204).send();
    },
  );

  // GET /exhibitions/:exhibitionId/certificates/:userId/preview
  // Get certificate preview data (template + participant name)
  app.get(
    "/:exhibitionId/certificates/:userId/preview",
    {
      preHandler: requireLiffAuth,
      schema: {
        tags: ["Certificate"],
        summary: "Get certificate preview data for a user",
        description:
          "Returns certificate template data along with participant name for preview",
        params: CertificateUserParamsSchema,
        response: {
          200: CertificatePreviewResponseSchema,
          404: CertificateErrorResponseSchema,
        },
      },
    },
    async (req, reply) => {
      const { exhibitionId, userId } = req.params;

      // S3: Ownership check — users can only preview their own certificate
      if (req.lineUser && req.lineUser.user_id !== Number(userId)) {
        throw new AppError(
          "You can only preview your own certificate",
          403,
          "FORBIDDEN",
        );
      }

      // Get certificate template
      const template = await getCertificateTemplateByExhibitionId(exhibitionId);
      if (!template) {
        return reply.status(404).send({
          message: "certificate template not found",
          status: 404,
          code: "NOT_FOUND",
        });
      }

      // Get registration data
      const userData = await getRegisteredParticipantName(exhibitionId, userId);
      if (!userData) {
        return reply.status(404).send({
          message: "User is not registered in this exhibition",
          status: 404,
          code: "NOT_FOUND",
        });
      }

      return {
        template,
        participantName: userData.participant_name,
      };
    },
  );

  // GET /exhibitions/:exhibitionId/certificates/:registrationId/download
  // Generate and download certificate for a specific registration
  app.get(
    "/:exhibitionId/certificates/:userId/download",
    {
      preHandler: requireLiffAuth,
      schema: {
        tags: ["Certificate"],
        summary: "Download generated certificate for a registration",
        description:
          "Generates a certificate image with participant name overlaid on the template background. Admin users can add ?skipValidation=true to bypass check-in requirements.",
        params: CertificateUserParamsSchema,
        querystring: CertificateDownloadQuerySchema,
        produces: ["application/pdf"],
        response: {
          200: z.any().describe("Certificate image (PNG)"),
          403: CertificateDownloadErrorResponseSchema,
          404: CertificateErrorResponseSchema,
        },
      },
    },
    async (req, reply) => {
      const { exhibitionId, userId } = req.params;
      const { skipValidation } = req.query;

      // Check if admin wants to skip validation (requires auth)
      const isAdminSkip = skipValidation === "true" && req.user;

      // S3: Ownership check — users can only download their own certificate (unless admin skip)
      if (
        !isAdminSkip &&
        req.lineUser &&
        req.lineUser.user_id !== Number(userId)
      ) {
        throw new AppError(
          "You can only download your own certificate",
          403,
          "FORBIDDEN",
        );
      }

      // Get certificate template
      const template = await getCertificateTemplateByExhibitionId(exhibitionId);
      if (!template) {
        return reply.status(404).send({
          message: "certificate template not found",
          status: 404,
          code: "NOT_FOUND",
        });
      }

      // Get registration data
      const userData = await getRegisteredParticipantName(exhibitionId, userId);
      if (!userData) {
        return reply.status(404).send({
          message: "User is not registered in this exhibition",
          status: 404,
          code: "NOT_FOUND",
        });
      }

      // Skip check-in validation for admin test downloads
      if (!isAdminSkip) {
        // Check if user has completed all unit check-ins
        const checkinStatus = await getUserCheckinCompletionStatus(
          exhibitionId,
          userId,
        );

        if (checkinStatus.total_units === 0) {
          return reply.status(403).send({
            message:
              "Cannot download certificate: This exhibition has no units configured.",
            status: 403,
            code: "NO_UNITS_CONFIGURED",
            details: {
              total_units: 0,
              checked_in_units: 0,
              missing_units: 0,
            },
          });
        }

        if (!checkinStatus.is_complete) {
          const missing =
            checkinStatus.total_units - checkinStatus.checked_in_units;
          return reply.status(403).send({
            message: `Cannot download certificate: You have checked in to ${checkinStatus.checked_in_units} of ${checkinStatus.total_units} units. Please complete all unit check-ins.`,
            status: 403,
            code: "INCOMPLETE_CHECKINS",
            details: {
              total_units: checkinStatus.total_units,
              checked_in_units: checkinStatus.checked_in_units,
              missing_units: missing,
            },
          });
        }
      }

      // Generate certificate
      const certificateBuffer = await generateCertificate({
        backgroundUrl: template.background_url,
        layoutConfig: template.layout_config || {},
        data: {
          participant_name: userData.participant_name,
        },
      });

      // Create filename - ASCII only for basic filename, UTF-8 encoded for filename*
      const asciiFilename = `certificate_${userId}.pdf`;
      const utf8Filename = `certificate_${userData.participant_name}_${userId}.pdf`;
      const encodedFilename = encodeURIComponent(utf8Filename);

      // Send response with RFC 5987 compliant Content-Disposition
      reply
        .header("Content-Type", "application/pdf")
        .header(
          "Content-Disposition",
          `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
        )
        .send(certificateBuffer);
    },
  );
}
