import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { AppError } from "../errors.js";
import {
  getUserRegistrationsByLineId,
  getUserTickets,
  verifyAndCheckIn,
} from "../queries/ticket-query.js";
import { verifyLiffIdToken } from "../services/line/security.js";
import {
  AuthHeaderSchema,
  UserTicketSchema,
  GetQrTokenQuerySchema,
  QrTokenResponseSchema,
  VerifyTicketBodySchema,
  CheckInResultSchema,
  type GetQrTokenQuery,
  type VerifyTicketBody,
} from "../models/ticket.model.js";

export default async function ticketController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get("/", {
    schema: {
      tags: ["Tickets"],
      summary: "Get all registered exhibitions for the user",
      headers: AuthHeaderSchema,
      response: {
        200: z.array(UserTicketSchema),
      },
    }
  },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) throw new AppError("Missing Auth", 401, "MISSING_AUTH");

        // 1. Verify LIFF Token
        const token = authHeader.split(" ")[1];
        const verifiedToken = await verifyLiffIdToken(token);

        // 2. หา User ID ใน DB เรา (ใช้ function เดิมช่วยหา)
        const userData = await getUserRegistrationsByLineId(verifiedToken.sub);

        if (!userData) {
          return reply.code(200).send([]);
        }

        // 3. ดึงรายการตั๋วแบบละเอียด
        const tickets = await getUserTickets(userData.user_id);

        return reply.code(200).send(tickets);
      } catch (error) {
        if (error instanceof AppError) return reply.code(error.status).send(error);
        req.log.error(error);
        return reply.code(500).send({ message: "Internal Server Error" });
      }
    }
  );

  // Generate QR token for authenticated user
  app.get(
    "/qr-token",
    {
      schema: {
        tags: ["Tickets"],
        summary: "Generate QR token for a specific exhibition",
        querystring: GetQrTokenQuerySchema,
        headers: AuthHeaderSchema,
        response: {
          200: QrTokenResponseSchema,
        },
      },
    },
    async (req: FastifyRequest<{ Querystring: GetQrTokenQuery }>, reply: FastifyReply) => {
      try {
        // Step 1: Get the Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          throw new AppError("Authorization header is required", 401, "MISSING_AUTH_HEADER");
        }

        // Extract Bearer token
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
          throw new AppError("Invalid Authorization header format. Expected: Bearer <token>", 401, "INVALID_AUTH_FORMAT");
        }

        const liffIdToken = parts[1];

        // Step 2: Verify the LINE LIFF ID token
        let verifiedToken;
        try {
          verifiedToken = await verifyLiffIdToken(liffIdToken);
        } catch (error) {
          if (error instanceof AppError) {
            throw error;
          }
          throw new AppError("Token verification failed", 401, "TOKEN_VERIFICATION_FAILED");
        }

        // Step 3: Get the LINE User ID from verified token
        const lineUserId = verifiedToken.sub;

        // Step 4: Query database for user and their registrations
        const userData = await getUserRegistrationsByLineId(lineUserId);
        if (!userData) {
          return reply.code(404).send({ message: "User not found" });
        }
        // เช็คว่า User มีสิทธิ์ใน exhibition_id ที่ส่งมาไหม?
        const targetExhibitionId = Number(req.query.exhibition_id);
        const hasTicket = userData.exhibitions.includes(targetExhibitionId);
        if (!hasTicket) {
          return reply.code(403).send({
            message: "คุณไม่มีบัตรสำหรับเข้างานนี้ (Access Denied)"
          });
        }
        // Step 5: Generate QR JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) throw new AppError("JWT_SECRET missing", 500, "CONFIG_ERROR");

        const qrTokenPayload = {
          uid: userData.user_id,
          eid: targetExhibitionId,
          type: "access"
        };

        const expiresIn = 300; // 5 minutes in seconds
        const qrToken = jwt.sign(qrTokenPayload, jwtSecret, {
          expiresIn,
        });

        // Step 6: Return the response
        return {
          qr_token: qrToken,
          expires_in: expiresIn,
        };
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.status).send({
            message: error.message,
            code: error.code,
          });
        }
        req.log.error({ err: error }, "failed to generate QR token");
        return reply.code(500).send({ message: "internal server error" });
      }
    }
  );

  app.post(
    "/verify",
    {
      schema: {
        tags: ["Tickets"],
        summary: "Staff verify ticket and record check-in",
        headers: AuthHeaderSchema,
        body: VerifyTicketBodySchema,
        response: {
          200: CheckInResultSchema,
          409: CheckInResultSchema,
        },
      }
    },
    async (req: FastifyRequest<{ Body: VerifyTicketBody }>, reply) => {
      try {
        // Step 1: Get and verify staff authorization
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          throw new AppError("Authorization header is required", 401, "MISSING_AUTH_HEADER");
        }

        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
          throw new AppError("Invalid Authorization header format. Expected: Bearer <token>", 401, "INVALID_AUTH_FORMAT");
        }

        const liffIdToken = parts[1];

        // Step 2: Verify the LINE LIFF ID token for staff
        let verifiedToken;
        try {
          verifiedToken = await verifyLiffIdToken(liffIdToken);
        } catch (error) {
          if (error instanceof AppError) {
            throw error;
          }
          throw new AppError("Token verification failed", 401, "TOKEN_VERIFICATION_FAILED");
        }

        const staffLineUserId = verifiedToken.sub;

        // Step 3: Get staff user_id from LINE user ID
        const staffData = await getUserRegistrationsByLineId(staffLineUserId);
        if (!staffData) {
          throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");
        }

        const currentStaffId = staffData.user_id;

        // Step 4: Get and verify visitor token
        const { token } = req.body;
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new AppError("JWT_SECRET missing", 500, "CONFIG_ERROR");

        let payload: any;
        try {
          payload = jwt.verify(token, secret);
        } catch (err) {
          return reply.code(400).send({
            success: false,
            message: "❌ QR Code ไม่ถูกต้องหรือหมดอายุ"
          });
        }

        const { uid: visitorId, eid: exhibitionId } = payload;

        // Step 5: Execute Logic (Check Permission -> Validate -> Insert)
        const result = await verifyAndCheckIn(
          currentStaffId,
          visitorId,
          exhibitionId,
        );

        // ถ้าสแกนซ้ำ (Success=false) ส่ง 409 Conflict หรือ 200 ก็ได้แล้วแต่ Design Frontend
        // แต่ปกติ 409 จะสื่อความหมายดีกว่าว่า "ซ้ำนะ"
        if (!result.success) {
          return reply.code(409).send(result);
        }

        return result;

      } catch (error) {
        if (error instanceof AppError) {
          // กรณี Staff ไม่มีสิทธิ์ (403) หรือ User ไม่ได้ลงทะเบียน (404)
          return reply.code(error.status).send({
            success: false,
            message: error.message,
            code: error.code
          });
        }
        req.log.error(error);
        return reply.code(500).send({ success: false, message: "Internal Server Error" });
      }
    }
  );
}

