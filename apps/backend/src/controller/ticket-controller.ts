import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { AppError } from "../errors.js";
import {
  createTicket,
  getTicketById,
  getTicketsByExhibition,
  getTicketsByUser,
  useTicket,
  getTicketByCode,
  getUserRegistrationsByLineId,
  type CreateTicketPayload,
} from "../queries/ticket-query.js";
import { verifyLiffIdToken } from "../services/line/security.js";

type CreateTicketBody = {
  exhibition_id: number;
  user_id: number;
  ticket_type: "visitor" | "staff" | "vip";
};

type UseTicketParams = {
  ticketId: string;
};

type GetTicketParams = {
  ticketId: string;
};

type GetTicketByCodeQuery = {
  code: string;
};

type GetTicketsByExhibitionQuery = {
  exhibition_id?: string;
};

type GetTicketsByUserQuery = {
  user_id?: string;
};

export default async function ticketController(fastify: FastifyInstance) {
  // Generate QR token for authenticated user
  fastify.get(
    "/my-qr",
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
        response: {
          200: { $ref: "QrTokenResponse#" },
          401: {
            type: "object",
            properties: {
              message: { type: "string" },
              code: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
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

  // Create a new ticket
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Tickets"],
        summary: "Create a new ticket for an exhibition",
        body: { $ref: "CreateTicketInput#" },
        response: {
          201: { $ref: "Ticket#" },
        },
      },
    },
    async (req: FastifyRequest<{ Body: CreateTicketBody }>, reply: FastifyReply) => {
      try {
        const { exhibition_id, user_id, ticket_type } = req.body;

        if (!exhibition_id || !user_id || !ticket_type) {
          throw new AppError("missing required fields", 400, "VALIDATION_ERROR");
        }

        if (!Number.isInteger(exhibition_id) || exhibition_id <= 0) {
          throw new AppError("invalid exhibition_id", 400, "VALIDATION_ERROR");
        }

        if (!Number.isInteger(user_id) || user_id <= 0) {
          throw new AppError("invalid user_id", 400, "VALIDATION_ERROR");
        }

        if (!["visitor", "staff", "vip"].includes(ticket_type)) {
          throw new AppError("invalid ticket_type", 400, "VALIDATION_ERROR");
        }

        const payload: CreateTicketPayload = {
          exhibition_id,
          user_id,
          ticket_type,
        };

        const ticket = await createTicket(payload);
        reply.code(201);
        return ticket;
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.status).send({
            message: error.message,
            code: error.code,
          });
        }
        req.log.error({ err: error }, "failed to create ticket");
        return reply.code(500).send({ message: "internal server error" });
      }
    }
  );

  // Get ticket by ID
  fastify.get(
    "/:ticketId",
    {
      schema: {
        tags: ["Tickets"],
        summary: "Get ticket details by ID",
        params: {
          type: "object",
          properties: {
            ticketId: { type: "string", pattern: "^[0-9]+$" },
          },
          required: ["ticketId"],
        },
        response: {
          200: { $ref: "TicketWithDetails#" },
          404: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (req: FastifyRequest<{ Params: GetTicketParams }>, reply: FastifyReply) => {
      try {
        const ticketId = Number(req.params.ticketId);

        if (!Number.isInteger(ticketId) || ticketId <= 0) {
          throw new AppError("invalid ticket_id", 400, "VALIDATION_ERROR");
        }

        const ticket = await getTicketById(ticketId);

        if (!ticket) {
          return reply.code(404).send({ message: "ticket not found" });
        }

        return ticket;
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.status).send({
            message: error.message,
            code: error.code,
          });
        }
        req.log.error({ err: error }, "failed to get ticket");
        return reply.code(500).send({ message: "internal server error" });
      }
    }
  );

  // Get tickets by exhibition or user
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Tickets"],
        summary: "Get tickets by exhibition ID or user ID",
        querystring: {
          type: "object",
          properties: {
            exhibition_id: { type: "string", pattern: "^[0-9]+$" },
            user_id: { type: "string", pattern: "^[0-9]+$" },
            code: { type: "string" },
          },
        },
        response: {
          200: {
            oneOf: [
              { type: "array", items: { $ref: "TicketWithDetails#" } },
              { $ref: "TicketWithDetails#" },
            ],
          },
        },
      },
    },
    async (
      req: FastifyRequest<{
        Querystring: GetTicketsByExhibitionQuery & GetTicketsByUserQuery & GetTicketByCodeQuery;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { exhibition_id, user_id, code } = req.query;

        // Get ticket by code
        if (code) {
          const ticket = await getTicketByCode(code);
          if (!ticket) {
            return reply.code(404).send({ message: "ticket not found" });
          }
          return ticket;
        }

        // Get tickets by exhibition
        if (exhibition_id) {
          const exhibitionIdNum = Number(exhibition_id);
          if (!Number.isInteger(exhibitionIdNum) || exhibitionIdNum <= 0) {
            throw new AppError("invalid exhibition_id", 400, "VALIDATION_ERROR");
          }
          const tickets = await getTicketsByExhibition(exhibitionIdNum);
          return tickets;
        }

        // Get tickets by user
        if (user_id) {
          const userIdNum = Number(user_id);
          if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
            throw new AppError("invalid user_id", 400, "VALIDATION_ERROR");
          }
          const tickets = await getTicketsByUser(userIdNum);
          return tickets;
        }

        throw new AppError("exhibition_id, user_id, or code is required", 400, "VALIDATION_ERROR");
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.status).send({
            message: error.message,
            code: error.code,
          });
        }
        req.log.error({ err: error }, "failed to get tickets");
        return reply.code(500).send({ message: "internal server error" });
      }
    }
  );

  // Use/redeem a ticket
  fastify.patch(
    "/:ticketId/use",
    {
      schema: {
        tags: ["Tickets"],
        summary: "Mark a ticket as used/redeemed",
        params: {
          type: "object",
          properties: {
            ticketId: { type: "string", pattern: "^[0-9]+$" },
          },
          required: ["ticketId"],
        },
        response: {
          200: { $ref: "Ticket#" },
          400: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (req: FastifyRequest<{ Params: UseTicketParams }>, reply: FastifyReply) => {
      try {
        const ticketId = Number(req.params.ticketId);

        if (!Number.isInteger(ticketId) || ticketId <= 0) {
          throw new AppError("invalid ticket_id", 400, "VALIDATION_ERROR");
        }

        const ticket = await useTicket(ticketId);

        if (!ticket) {
          return reply.code(404).send({ message: "ticket not found or already used" });
        }

        return ticket;
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.status).send({
            message: error.message,
            code: error.code,
          });
        }
        req.log.error({ err: error }, "failed to use ticket");
        return reply.code(500).send({ message: "internal server error" });
      }
    }
  );
}
