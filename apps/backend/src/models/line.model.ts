import { z } from "zod";

// Zod Schemas for LINE Controller

export const LineEventSourceSchema = z.object({
  type: z.string().optional(),
  userId: z.string().optional(),
});

export const LineEventMessageSchema = z.object({
  type: z.string().optional(),
  text: z.string().optional(),
});

export const LineEventSchema = z.object({
  type: z.string(),
  replyToken: z.string().optional(),
  source: LineEventSourceSchema.optional(),
  message: LineEventMessageSchema.optional(),
});

export const LineWebhookPayloadSchema = z.object({
  events: z.array(LineEventSchema).optional(),
});

export const LineWebhookResponseSchema = z.object({
  ok: z.boolean(),
});

// Type exports (inferred from Zod schemas)
export type LineEventSource = z.infer<typeof LineEventSourceSchema>;
export type LineEventMessage = z.infer<typeof LineEventMessageSchema>;
export type LineEvent = z.infer<typeof LineEventSchema>;
export type LineWebhookPayload = z.infer<typeof LineWebhookPayloadSchema>;
export type LineWebhookResponse = z.infer<typeof LineWebhookResponseSchema>;
