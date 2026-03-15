import { z } from "zod";

// Zod Schemas for Ticket Controller

// Headers schema for authentication
// Made optional to allow manual validation in route handlers with better error messages
export const AuthHeaderSchema = z.object({
  authorization: z
    .string()
    .min(1)
    .describe("Bearer token (LINE LIFF ID token)")
    .refine((val) => val.startsWith("Bearer "), {
      message: "Authorization header must start with 'Bearer '",
    })
    .optional(),
});

// User Ticket Response
export const UserTicketSchema = z.object({
  user_id: z.number().int(),
  registration_id: z.number().int().positive(),
  exhibition_id: z.number().int().positive(),
  title: z.string(),
  exhibition_code: z.string(),
  location: z.string().nullable(),
  start_date: z.date().or(z.string()),
  end_date: z.date().or(z.string()),
  picture_path: z.string().nullable(),
  status: z.string(),
  exhibition_set_id: z.number().nullable(),
  registered_at: z.date().or(z.string()),
  survey_completed: z.number().int().min(0).max(1),
});

// QR Token Request
export const GetQrTokenQuerySchema = z.object({
  exhibition_id: z
    .string()
    .regex(/^[0-9]+$/, "exhibition_id must be a numeric string"),
});

// QR Token Response
export const QrTokenResponseSchema = z.object({
  qr_token: z.string(),
  expires_in: z.number().int().positive(),
});

// Verify Ticket Request
export const VerifyTicketBodySchema = z.object({
  token: z.string().min(1, "token is required"),
});

// Check-in Result Response
export const CheckInResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  visitor: z
    .object({
      full_name: z.string(),
      picture_url: z.string().nullable(),
      checkin_at: z.date().or(z.string()),
    })
    .optional(),
});

// Check-in Status Query and Response
export const CheckInStatusQuerySchema = z.object({
  exhibition_id: z.string().regex(/^\d+$/, "exhibition_id must be a number"),
});

export const CheckInStatusResponseSchema = z.object({
  checked_in: z.boolean(),
  checkin_at: z.string().nullable(),
  unit_id: z.number().nullable(),
});

// Checked-in Units Query and Response
export const CheckedInUnitsQuerySchema = z.object({
  exhibition_id: z.string().regex(/^\d+$/, "exhibition_id must be a number"),
});

export const CheckedInUnitSchema = z.object({
  unit_id: z.number(),
  unit_name: z.string(),
  checkin_at: z.string(),
  survey_completed: z.boolean(),
});

export const CheckedInUnitsResponseSchema = z.array(CheckedInUnitSchema);

// Current Exhibition Response
export const CurrentExhibitionResponseSchema = z.object({
  current_exhibition_id: z.number().nullable(),
});

// Type exports (inferred from Zod schemas)
export type AuthHeader = z.infer<typeof AuthHeaderSchema>;
export type UserTicket = z.infer<typeof UserTicketSchema>;
export type GetQrTokenQuery = z.infer<typeof GetQrTokenQuerySchema>;
export type QrTokenResponse = z.infer<typeof QrTokenResponseSchema>;
export type VerifyTicketBody = z.infer<typeof VerifyTicketBodySchema>;
export type CheckInResult = z.infer<typeof CheckInResultSchema>;
export type CheckInStatusQuery = z.infer<typeof CheckInStatusQuerySchema>;
export type CheckInStatusResponse = z.infer<typeof CheckInStatusResponseSchema>;
export type CheckedInUnitsQuery = z.infer<typeof CheckedInUnitsQuerySchema>;
export type CheckedInUnit = z.infer<typeof CheckedInUnitSchema>;
export type CheckedInUnitsResponse = z.infer<
  typeof CheckedInUnitsResponseSchema
>;
export type CurrentExhibitionResponse = z.infer<
  typeof CurrentExhibitionResponseSchema
>;
