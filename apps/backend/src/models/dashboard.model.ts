import { z } from "zod";

const FeedbackBreakdownItemSchema = z.object({
  qt_id: z.number().int(),
  topic: z.string(),
  score: z.string(),
  response_count: z.number().int(),
});

const DashboardDataSchema = z.object({
  staff_info: z.object({
    id: z.number().int(),
    name: z.string(),
  }),
  unit_detail: z.object({
    id: z.number(),
    code: z.string().nullable(),
    name: z.string(),
    type: z.string(),
    description: z.string(),
    description_delta: z.any().nullable(),
    poster_url: z.string().nullable(),
    detail_pdf_url: z.string().nullable(),
    schedule: z.object({
      starts_at: z.string().nullable(),
      ends_at: z.string().nullable(),
    }),
  }),
  exhibition_context: z.object({
    id: z.number().int(),
    title: z.string(),
    location: z.string(),
    status: z.enum(["upcoming", "ongoing", "ended"]),
  }),
  stats: z.object({
    total_checkins: z.number().int(),
    total_reviews: z.number().int(),
    average_rating: z.string().nullable(),
  }),
  feedback_breakdown: z.array(FeedbackBreakdownItemSchema),
});

export const DashboardResponseSchema = z.object({
  status: z.literal("success"),
  data: DashboardDataSchema,
});

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
export type DashboardData = z.infer<typeof DashboardDataSchema>;
export type FeedbackBreakdownItem = z.infer<typeof FeedbackBreakdownItemSchema>;
