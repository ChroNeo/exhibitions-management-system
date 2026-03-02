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

// ─── Organizer Dashboard ───────────────────────────────────────────────────

const OrgLabelValueSchema = z.object({
  label: z.string(),
  value: z.number().int(),
});

const OrgAgeGroupSchema = z.object({
  label: z.string(),
  value: z.number().int(),
  percent: z.number(),
});

const OrgFeedbackTopicSchema = z.object({
  topic: z.string(),
  score: z.number(),
});

const OrgUnitFeedbackDetailSchema = z.object({
  topic: z.string(),
  score: z.number(),
});

const OrgUnitStatSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  type: z.string(),
  checkins: z.number().int(),
  rating: z.number(),
  feedback_details: z.array(OrgUnitFeedbackDetailSchema),
  recent_comments: z.array(z.string()),
});

const OrgDashboardDataSchema = z.object({
  exhibition_info: z.object({
    id: z.number().int(),
    title: z.string(),
    description: z.string().nullable(),
    status: z.string(),
    location: z.string(),
  }),
  kpis: z.object({
    total_registrations: z.number().int(),
    total_units: z.number().int(),
    total_checkins: z.number().int(),
    exhibition_avg_score: z.number().nullable(),
  }),
  demographics: z.object({
    gender: z.array(OrgLabelValueSchema),
    age_groups: z.array(OrgAgeGroupSchema),
  }),
  feedback_breakdown: z.array(OrgFeedbackTopicSchema),
  recent_comments: z.array(z.string()),
  all_units_stats: z.array(OrgUnitStatSchema),
});

export const OrgDashboardResponseSchema = z.object({
  status: z.literal("success"),
  data: OrgDashboardDataSchema,
});

export type OrgDashboardResponse = z.infer<typeof OrgDashboardResponseSchema>;
