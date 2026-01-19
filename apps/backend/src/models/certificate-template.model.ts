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
export const LayoutConfigSchema = z.object({
  participant_name: LayoutFieldConfigSchema.optional(),
  exhibition_title: LayoutFieldConfigSchema.optional(),
  date: LayoutFieldConfigSchema.optional(),
  organizer_name: LayoutFieldConfigSchema.optional(),
}).passthrough(); // Allow additional fields

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
export const UpdateCertificateTemplateSchema = CreateCertificateTemplateSchema.partial();

// Inferred types from Zod schemas
export type LayoutFieldConfig = z.infer<typeof LayoutFieldConfigSchema>;
export type LayoutConfig = z.infer<typeof LayoutConfigSchema>;
export type CertificateTemplate = z.infer<typeof CertificateTemplateSchema>;
export type CertificateTemplateView = z.infer<typeof CertificateTemplateViewSchema>;
export type CreateCertificateTemplateInput = z.infer<typeof CreateCertificateTemplateSchema>;
export type UpdateCertificateTemplateInput = z.infer<typeof UpdateCertificateTemplateSchema>;
