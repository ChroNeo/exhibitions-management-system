import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { AppError } from "../errors.js";
import {
  getUserRegistrationsByLineId,
  getUserTickets,
} from "../queries/ticket-query.js";
import { verifyLiffIdToken } from "../services/line/security.js";

export default async function ticketController(fastify: FastifyInstance) {
  fastify.get("/", {
    schema: {
      tags: ["Tickets"],
      summary: "Get all registered exhibitions for the user",
      headers: {
        type: "object",
        required: ["Authorization"],
        properties: {
          Authorization: { type: "string", description: "LIFF ID Token" }
        }
      }
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
          return [];
        }

        // 3. ดึงรายการตั๋วแบบละเอียด
        const tickets = await getUserTickets(userData.user_id);

        return tickets;
      } catch (error) {
        if (error instanceof AppError) return reply.code(error.status).send(error);
        req.log.error(error);
        return reply.code(500).send({ message: "Internal Server Error" });
      }
    }
  );

  // Generate QR token for authenticated user
  fastify.get(
    "/qr-token",
    {
      schema: {
        tags: ["Tickets"],
        summary: "Generate a signed JWT token for QR code display",
        description: "Returns a JWT token containing user registration data. Requires LINE LIFF ID token in Authorization header.",
        headers: {
          type: "object",
          properties: {
            Authorization: {
              type: "string",
              description: "Bearer token (LINE LIFF ID token from liff.getIDToken())",
              example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
          required: ["Authorization"],
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
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
          return reply.code(404).send({
            message: "User not found. Please register for an exhibition first.",
          });
        }

        // Step 5: Generate QR JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          throw new AppError("JWT_SECRET is not configured", 500, "CONFIG_ERROR");
        }

        const qrTokenPayload = {
          uid: userData.user_id,
          exs: userData.exhibitions,
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
}
