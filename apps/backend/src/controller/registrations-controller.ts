import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors.js";
import {
  registerForExhibition,
  type RegistrationPayload,
  type RegistrationRole,
} from "../queries/registrations-query.js";

type RegistrationBody = RegistrationPayload;

const normaliseString = (value: string | undefined | null) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : undefined;
};

export default async function registrationsController(fastify: FastifyInstance) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Registrations"],
        summary: "Register a visitor or staff member for an exhibition",
        body: { $ref: "RegistrationInput#" },
        response: {
          201: { $ref: "RegistrationResponse#" },
        },
      },
    },
    async (req: FastifyRequest<{ Body: RegistrationBody }>, reply: FastifyReply) => {
      try {
        const body = req.body;
        const required: Array<keyof RegistrationBody> = [
          "exhibition_id",
          "full_name",
          "email",
          "role",
        ];

        for (const field of required) {
          if (body[field] === undefined || body[field] === null) {
            throw new AppError("missing required fields", 400, "VALIDATION_ERROR");
          }
        }

        const exhibitionId = Number(body.exhibition_id);
        if (!Number.isInteger(exhibitionId) || exhibitionId <= 0) {
          throw new AppError("invalid exhibition_id", 400, "VALIDATION_ERROR");
        }

        const fullName = normaliseString(body.full_name);
        const email = normaliseString(body.email);
        const unitCode = normaliseString(body.unit_code);
        const phone = normaliseString(body.phone);

        if (!fullName || !email) {
          throw new AppError("missing required fields", 400, "VALIDATION_ERROR");
        }

        const role = body.role as RegistrationRole;
        if (role === "staff" && !unitCode) {
          throw new AppError("unit_code required for staff", 400, "VALIDATION_ERROR");
        }

        const payload: RegistrationPayload = {
          exhibition_id: exhibitionId,
          full_name: fullName,
          gender: body.gender,
          birthdate: normaliseString(body.birthdate),
          email,
          phone,
          role,
          unit_code: unitCode,
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
