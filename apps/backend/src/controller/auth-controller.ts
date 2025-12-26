import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AppError } from "../errors.js";
import {
  authenticateOrganizerUser,
  createOrganizerUser,
} from "../queries/auth-query.js";
import { signJwt } from "../services/jwt.js";
import {
  RegisterBody,
  SignInBody,
  SignInResponse,
  SignInSchema,
  RegisterSchema,
  SignInResponseSchema,
  UserResponseSchema,
} from "../models/auth.model.js";

export default async function authController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.post(
    "/signin",
    {
      schema: {
        tags: ["Auth"],
        summary: "Organizer sign in",
        body: SignInSchema,
        response: {
          200: SignInResponseSchema,
        },
      },
    },
    async (
      req: FastifyRequest<{ Body: SignInBody }>
    ): Promise<SignInResponse> => {
      const { username, password } = req.body;

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

  app.post(
    "/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "Organizer registration",
        body: RegisterSchema,
        response: {
          201: UserResponseSchema,
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
      } = req.body;

      const user = await createOrganizerUser({
        username: username.trim(),
        password,
        email: email ?? null,
        role,
      });

      reply.code(201);
      return user;
    }
  );

  app.post(
    "/logout",
    {
      schema: {
        tags: ["Auth"],
        summary: "Organizer logout",
        response: {
          204: z.null().describe("Signed out"),
        },
      },
    },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      reply.code(204).send();
    }
  );
}