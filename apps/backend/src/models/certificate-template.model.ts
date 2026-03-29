import { z } from "zod";

// Layout config schema for each text field
export const LayoutFieldConfigSchema = z.object({
  x: z.number(),
  y: z.number(),
  font_size: z.number(),
  color: z.string(),
  align: z.enum(["left", "center", "right"]),
});

// Layout config schema (JSON object with field names as keys)
export const LayoutConfigSchema = z
  .object({
    participant_name: LayoutFieldConfigSchema.optional(),
    exhibition_title: LayoutFieldConfigSchema.optional(),
    date: LayoutFieldConfigSchema.optional(),
    organizer_name: LayoutFieldConfigSchema.optional(),
  })
  .passthrough(); // Allow additional fields

// Certificate Template Schema (from database)
export const CertificateTemplateSchema = z.object({
  template_id: z.number(),
  exhibition_id: z.number(),
  background_url: z.string(),
  layout_config: LayoutConfigSchema.nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// Certificate Template with exhibition details (from view)
export const CertificateTemplateViewSchema = CertificateTemplateSchema.extend({
  exhibition_code: z.string(),
  exhibition_title: z.string(),
  organizer_name: z.string(),
});

// Schema for Create Certificate Template
export const CreateCertificateTemplateSchema = z.object({
  background_url: z.string(),
  layout_config: LayoutConfigSchema.optional(),
});

// Schema for Update Certificate Template
export const UpdateCertificateTemplateSchema =
  CreateCertificateTemplateSchema.partial();

// Common params schema for certificate endpoints
export const ExhibitionIdParamSchema = z.object({
  exhibitionId: z.string().regex(/^\d+$/),
});

export const CertificateUserParamsSchema = z.object({
  exhibitionId: z.string().regex(/^\d+$/),
  userId: z.string().regex(/^\d+$/),
});

// Error response schema
export const CertificateErrorResponseSchema = z.object({
  message: z.string(),
  status: z.number(),
  code: z.string(),
});

// Certificate preview response schema
export const CertificatePreviewResponseSchema = z.object({
  template: CertificateTemplateViewSchema,
  participantName: z.string(),
});

// Certificate download query schema
export const CertificateDownloadQuerySchema = z.object({
  skipValidation: z.string().optional(),
  liff_id_token: z.string().optional(),
});

// Certificate download error response with details
export const CertificateDownloadErrorResponseSchema = z.object({
  message: z.string(),
  status: z.number(),
  code: z.string(),
  details: z
    .object({
      total_units: z.number(),
      checked_in_units: z.number(),
      missing_units: z.number(),
    })
    .optional(),
});

// Inferred types from Zod schemas
export type LayoutFieldConfig = z.infer<typeof LayoutFieldConfigSchema>;
export type LayoutConfig = z.infer<typeof LayoutConfigSchema>;
export type CertificateTemplate = z.infer<typeof CertificateTemplateSchema>;
export type CertificateTemplateView = z.infer<
  typeof CertificateTemplateViewSchema
>;
export type CreateCertificateTemplateInput = z.infer<
  typeof CreateCertificateTemplateSchema
>;
export type UpdateCertificateTemplateInput = z.infer<
  typeof UpdateCertificateTemplateSchema
>;
export type ExhibitionIdParam = z.infer<typeof ExhibitionIdParamSchema>;
export type CertificateUserParams = z.infer<typeof CertificateUserParamsSchema>;
export type CertificateErrorResponse = z.infer<
  typeof CertificateErrorResponseSchema
>;
export type CertificatePreviewResponse = z.infer<
  typeof CertificatePreviewResponseSchema
>;
export type CertificateDownloadQuery = z.infer<
  typeof CertificateDownloadQuerySchema
>;
export type CertificateDownloadErrorResponse = z.infer<
  typeof CertificateDownloadErrorResponseSchema
>;
