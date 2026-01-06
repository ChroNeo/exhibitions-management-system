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
  registration_id: z.number().int().positive(),
  exhibition_id: z.number().int().positive(),
  title: z.string(),
  code: z.string(),
  location: z.string().nullable(),
  start_date: z.date().or(z.string()),
  end_date: z.date().or(z.string()),
  picture_path: z.string().nullable(),
  status: z.string(),
  registered_at: z.date().or(z.string()),
});

// QR Token Request
export const GetQrTokenQuerySchema = z.object({
  exhibition_id: z.string().regex(/^[0-9]+$/, "exhibition_id must be a numeric string"),
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

// Type exports (inferred from Zod schemas)
export type AuthHeader = z.infer<typeof AuthHeaderSchema>;
export type UserTicket = z.infer<typeof UserTicketSchema>;
export type GetQrTokenQuery = z.infer<typeof GetQrTokenQuerySchema>;
export type QrTokenResponse = z.infer<typeof QrTokenResponseSchema>;
export type VerifyTicketBody = z.infer<typeof VerifyTicketBodySchema>;
export type CheckInResult = z.infer<typeof CheckInResultSchema>;
