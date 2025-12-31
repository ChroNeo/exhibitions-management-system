import { z } from "zod";

// Zod Schemas for Feature/Hero Controller

export const FeatureQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional(),
  status: z.string().optional(),
});

export const FeatureImageSchema = z.object({
  image: z.string().nullable(),
  href: z.string(),
  ref_id: z.number(),
});

export const ExhibitionSummarySchema = z.object({
  exhibition_id: z.number(),
  title: z.string(),
  status: z.string().nullable(),
  start_date: z.string().or(z.date()),
  end_date: z.string().or(z.date()),
  location: z.string().nullable(),
});

export const FeatureResponseSchema = z.object({
  featureImages: z.array(FeatureImageSchema),
  exhibitions: z.array(ExhibitionSummarySchema),
});

// Type exports (inferred from Zod schemas)
export type FeatureQuery = z.infer<typeof FeatureQuerySchema>;
export type FeatureImage = z.infer<typeof FeatureImageSchema>;
export type ExhibitionSummary = z.infer<typeof ExhibitionSummarySchema>;
export type FeatureResponse = z.infer<typeof FeatureResponseSchema>;
