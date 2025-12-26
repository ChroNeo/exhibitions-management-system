import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { AppError } from "../errors.js";
import {
  registerForExhibition,
  type RegistrationPayload,
} from "../queries/registrations-query.js";
import {
  RegistrationInputSchema,
  RegistrationResponseSchema,
  type RegistrationInput,
} from "../models/registration.model.js";

export default async function registrationsController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    "/",
    {
      schema: {
        tags: ["Registrations"],
        summary: "Register a visitor or staff member for an exhibition",
        body: RegistrationInputSchema,
        response: {
          201: RegistrationResponseSchema,
        },
      },
    },
    async (req: FastifyRequest<{ Body: RegistrationInput }>, reply: FastifyReply) => {
      try {
        const body = req.body;

        // Zod has already validated the input, so we can directly build the payload
        const payload: RegistrationPayload = {
          exhibition_id: body.exhibition_id,
          full_name: body.full_name,
          gender: body.gender,
          birthdate: body.birthdate,
          email: body.email,
          phone: body.phone,
          role: body.role,
          unit_code: body.unit_code,
          line_user_id: body.line_user_id,
        };

        const result = await registerForExhibition(payload);
        reply.code(201);
        return result;
      } catch (error) {
        if (error instanceof AppError) {
          const details =
            error.details === null || error.details === undefined
              ? undefined
              : error.details;
          return reply.code(error.status).send({
            message: error.message,
            code: error.code,
            ...(details !== undefined ? { details } : {}),
          });
        }
        req.log.error({ err: error }, "failed to process registration");
        return reply.code(500).send({ message: "internal server error" });
      }
    }
  );
}
