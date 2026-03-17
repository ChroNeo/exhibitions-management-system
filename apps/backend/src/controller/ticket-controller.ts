import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import jwt from "jsonwebtoken";
import { AppError } from "../errors.js";
import {
  CheckInResultSchema,
  CheckInStatusQuerySchema,
  CheckInStatusResponseSchema,
  CheckedInUnitsQuerySchema,
  CheckedInUnitsResponseSchema,
  CurrentExhibitionResponseSchema,
  GetQrTokenQuerySchema,
  QrTokenResponseSchema,
  VerifyTicketBodySchema,
} from "../models/ticket.model.js";
import { getCurrentExhibitionByLineId } from "../queries/line-query.js";
import { verifyAndCheckIn } from "../queries/ticket-query.js";
import { requireLiffAuth } from "../services/auth-middleware.js";
import { safeQuery } from "../services/dbconn.js";

export default async function ticketController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // app.get(
  //   "/",
  //   {
  //     preHandler: requireLiffAuth,
  //     schema: {
  //       tags: ["Tickets"],
  //       summary: "Get all registered exhibitions for the user",
  //       response: {
  //         200: z.array(UserTicketSchema),
  //       },
  //     },
  //   },
  //   async (req, reply) => {
  //     const tickets = await getUserTickets(req.lineUser!.user_id);
  //     return reply.code(200).send(tickets);
  //   },
  // );

  // Generate QR token for authenticated user
  app.get(
    "/qr-token",
    {
      preHandler: requireLiffAuth,
      schema: {
        tags: ["Tickets"],
        summary: "Generate QR token for a specific exhibition",
        querystring: GetQrTokenQuerySchema,
        response: {
          200: QrTokenResponseSchema,
        },
      },
    },
    async (req, reply) => {
      const targetExhibitionId = Number(req.query.exhibition_id);
      const hasRegistration =
        req.lineUser!.exhibitions.includes(targetExhibitionId);

      if (!hasRegistration) {
        throw new AppError(
          "คุณไม่มีการลงทะเบียนเข้างานนี้ (Access Denied)",
          403,
          "ACCESS_DENIED",
        );
      }

      const qrSecret = process.env.QR_TOKEN_SECRET || process.env.JWT_SECRET;
      if (!qrSecret)
        throw new AppError("QR_TOKEN_SECRET missing", 500, "CONFIG_ERROR");

      const qrTokenPayload = {
        uid: req.lineUser!.user_id,
        eid: targetExhibitionId,
        purpose: "qr_checkin",
      };

      const expiresIn = 300; // 5 minutes in seconds
      const qrToken = jwt.sign(qrTokenPayload, qrSecret, {
        expiresIn,
      });

      return {
        qr_token: qrToken,
        expires_in: expiresIn,
      };
    },
  );

  // Check if user has checked in to exhibition
  app.get(
    "/check-in-status",
    {
      preHandler: requireLiffAuth,
      schema: {
        tags: ["Tickets"],
        summary: "Check if user has checked in to an exhibition",
        querystring: CheckInStatusQuerySchema,
        response: {
          200: CheckInStatusResponseSchema,
        },
      },
    },
    async (req) => {
      const exhibitionId = Number(req.query.exhibition_id);

      const rows = await safeQuery<any[]>(
        `SELECT unit_id, checkin_at
         FROM units_checkins
         WHERE user_id = ? AND exhibition_id = ?
         ORDER BY checkin_at DESC
         LIMIT 1`,
        [req.lineUser!.user_id, exhibitionId],
      );

      if (rows.length === 0) {
        throw new AppError(
          "Registration not found",
          404,
          "REGISTRATION_NOT_FOUND",
        );
      }

      const checkedIn = rows[0].checkin_at !== null;
      const checkinAt = rows[0].checkin_at
        ? new Date(rows[0].checkin_at).toISOString()
        : null;
      const unitId = rows[0].unit_id || null;

      return {
        checked_in: checkedIn,
        checkin_at: checkinAt,
        unit_id: unitId,
      };
    },
  );

  // Get all units that user has checked in to for an exhibition
  app.get(
    "/checked-in-units",
    {
      preHandler: requireLiffAuth,
      schema: {
        tags: ["Tickets"],
        summary: "Get all units that user has checked in to for an exhibition",
        querystring: CheckedInUnitsQuerySchema,
        response: {
          200: CheckedInUnitsResponseSchema,
        },
      },
    },
    async (req) => {
      const exhibitionId = Number(req.query.exhibition_id);

      const rows = await safeQuery<any[]>(
        `SELECT
           uc.unit_id,
           u.unit_name as unit_name,
           uc.checkin_at,
           (SELECT COUNT(*) FROM survey_submissions ss
            WHERE ss.user_id = uc.user_id
            AND ss.exhibition_id = uc.exhibition_id
            AND ss.unit_id = uc.unit_id) as survey_completed
         FROM units_checkins uc
         JOIN units u ON uc.unit_id = u.unit_id
         WHERE uc.user_id = ? AND uc.exhibition_id = ? AND uc.checkin_at IS NOT NULL
         ORDER BY uc.checkin_at DESC`,
        [req.lineUser!.user_id, exhibitionId],
      );

      return rows.map((row) => ({
        unit_id: row.unit_id,
        unit_name: row.unit_name,
        checkin_at: new Date(row.checkin_at).toISOString(),
        survey_completed: row.survey_completed > 0,
      }));
    },
  );

  app.get(
    "/current-exhibition",
    {
      preHandler: requireLiffAuth,
      schema: {
        tags: ["Tickets"],
        summary: "Get the user's current exhibition ID",
        response: {
          200: CurrentExhibitionResponseSchema,
        },
      },
    },
    async (req) => {
      const exhibitionId = await getCurrentExhibitionByLineId(
        req.lineUser!.line_user_id,
      );
      return { current_exhibition_id: exhibitionId };
    },
  );

  app.post(
    "/verify",
    {
      preHandler: requireLiffAuth,
      schema: {
        tags: ["Tickets"],
        summary: "Staff verify ticket and record check-in",
        body: VerifyTicketBodySchema,
        response: {
          200: CheckInResultSchema,
          409: CheckInResultSchema,
        },
      },
    },
    async (req, reply) => {
      const { token } = req.body;
      const qrSecret = process.env.QR_TOKEN_SECRET || process.env.JWT_SECRET;
      if (!qrSecret)
        throw new AppError("QR_TOKEN_SECRET missing", 500, "CONFIG_ERROR");

      let payload: any;
      try {
        payload = jwt.verify(token, qrSecret);
      } catch (err) {
        throw new AppError(
          "❌ QR Code ไม่ถูกต้องหรือหมดอายุ",
          400,
          "INVALID_QR_TOKEN",
        );
      }

      // S4: Validate token purpose to prevent token type confusion
      if (payload.purpose !== "qr_checkin") {
        throw new AppError(
          "❌ Token ไม่ถูกต้อง (Invalid token type)",
          400,
          "INVALID_QR_TOKEN",
        );
      }

      const { uid: visitorId, eid: exhibitionId } = payload;

      const result = await verifyAndCheckIn(
        req.lineUser!.user_id,
        visitorId,
        exhibitionId,
      );

      if (!result.success) {
        return reply.code(409).send(result);
      }
      return result;
    },
  );
}
