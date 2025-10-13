import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "../errors.js";
import {
  authenticateOrganizerUser,
  createOrganizerUser,
} from "../queries/auth-query.js";
import { signJwt } from "../services/jwt.js";

type SignInBody = {
  username?: string;
  password?: string;
};

type SignInResponse = {
  token: string;
  token_type: "Bearer";
  expires_in: number;
  user: {
    user_id: number;
    username: string;
    email: string | null;
    role: string;
  };
};

type RegisterBody = {
  username?: string;
  password?: string;
  email?: string | null;
  role?: "admin" | "organizer";
};

export default async function authController(fastify: FastifyInstance) {
  fastify.post(
    "/signin",
    {
      schema: {
        tags: ["Auth"],
        summary: "Organizer sign in",
        body: {
          type: "object",
          required: ["username", "password"],
          additionalProperties: false,
          properties: {
            username: { type: "string", minLength: 1, example: "organizer01" },
            password: { type: "string", minLength: 1, example: "secret" },
          },
        },
        response: {
          200: {
            type: "object",
            required: ["token", "token_type", "expires_in", "user"],
            properties: {
              token: { type: "string", example: "eyJhbGci..." },
              token_type: { type: "string", enum: ["Bearer"] },
              expires_in: { type: "integer", example: 3600 },
              user: {
                type: "object",
                required: ["user_id", "username", "email", "role"],
                properties: {
                  user_id: { type: "integer", example: 1 },
                  username: { type: "string", example: "organizer01" },
                  email: { type: ["string", "null"], example: "organizer@example.com" },
                  role: { type: "string", example: "admin" },
                },
              },
            },
          },
        },
      },
    },
    async (
      req: FastifyRequest<{ Body: SignInBody }>
    ): Promise<SignInResponse> => {
      const { username, password } = req.body ?? {};

      if (typeof username !== "string" || !username.trim()) {
        throw new AppError("username is required", 400, "VALIDATION_ERROR");
      }
      if (typeof password !== "string" || !password) {
        throw new AppError("password is required", 400, "VALIDATION_ERROR");
      }

      const secret = process.env.JWT_SECRET;
      if (typeof secret !== "string" || !secret) {
        throw new AppError("JWT secret is not configured", 500, "CONFIG_ERROR");
      }

      const user = await authenticateOrganizerUser(username.trim(), password);

      const now = Math.floor(Date.now() / 1000);
      const expiresInRaw = process.env.JWT_EXPIRES_IN ?? "3600";
      const parsedExpiresIn = Number.parseInt(expiresInRaw, 10);
      const expiresIn =
        Number.isFinite(parsedExpiresIn) && parsedExpiresIn > 0
          ? parsedExpiresIn
          : 3600;
      const payload = {
        sub: String(user.user_id),
        type: "organizer",
        role: user.role,
        iat: now,
        exp: now + expiresIn,
      };

      const token = signJwt(payload, secret);

      return {
        token,
        token_type: "Bearer",
        expires_in: expiresIn,
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      };
    }
  );

  fastify.post(
    "/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "Organizer registration",
        body: {
          type: "object",
          required: ["username", "password"],
          additionalProperties: false,
          properties: {
            username: { type: "string", minLength: 3, example: "neworganizer" },
            password: { type: "string", minLength: 6, example: "StrongPass123" },
            email: {
              type: ["string", "null"],
              format: "email",
              example: "organizer@example.com",
            },
            role: {
              type: "string",
              enum: ["admin", "organizer"],
              default: "organizer",
            },
          },
        },
        response: {
          201: {
            type: "object",
            required: ["user_id", "username", "email", "role"],
            properties: {
              user_id: { type: "integer", example: 10 },
              username: { type: "string", example: "neworganizer" },
              email: { type: ["string", "null"], example: "organizer@example.com" },
              role: { type: "string", example: "organizer" },
            },
          },
        },
      },
    },
    async (
      req: FastifyRequest<{ Body: RegisterBody }>,
      reply: FastifyReply
    ) => {
      const {
        username,
        password,
        email = null,
        role = "organizer",
      } = req.body ?? {};

      if (typeof username !== "string" || username.trim().length < 3) {
        throw new AppError(
          "username must be at least 3 characters",
          400,
          "VALIDATION_ERROR"
        );
      }

      if (typeof password !== "string" || password.length < 6) {
        throw new AppError(
          "password must be at least 6 characters",
          400,
          "VALIDATION_ERROR"
        );
      }

      if (role !== "admin" && role !== "organizer") {
        throw new AppError("invalid role", 400, "VALIDATION_ERROR");
      }

      let normalizedEmail: string | null = null;
      if (email !== null && email !== undefined) {
        if (typeof email !== "string" || !email.trim()) {
          throw new AppError("email must be a valid string", 400, "VALIDATION_ERROR");
        }
        normalizedEmail = email.trim();
      }

      const user = await createOrganizerUser({
        username: username.trim(),
        password,
        email: normalizedEmail,
        role,
      });

      reply.code(201);
      return user;
    }
  );

  fastify.post(
    "/logout",
    {
      schema: {
        tags: ["Auth"],
        summary: "Organizer logout",
        response: {
          204: {
            description: "Signed out",
          },
        },
      },
    },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      reply.code(204).send();
    }
  );
}
