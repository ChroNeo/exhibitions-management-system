import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AppError } from "../errors.js";
import { addUnit, deleteUnit, getUnitsByExhibitionId, getUnitsById, updateUnit } from "../queries/units-query.js";
import { collectMultipartFields } from "../services/file-upload.js";
import { UNIT_TYPES, type AddUnitPayload, type UnitType, type UpdateUnitPayload } from "../models/unit_model.js";


function parseJsonDelta(value: unknown, fieldName: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.length) return null;
    try {
      JSON.parse(trimmed);
    } catch {
      throw new AppError(`${fieldName} must be valid JSON`, 400, "VALIDATION_ERROR");
    }
    return trimmed;
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      throw new AppError(`${fieldName} must be valid JSON`, 400, "VALIDATION_ERROR");
    }
  }

  throw new AppError(`${fieldName} must be valid JSON`, 400, "VALIDATION_ERROR");
}
export default async function unitsController(fastify: FastifyInstance) {
  await fastify.register(
    async (fastify) => {
      fastify.get(
        "/units",
        {
          schema: {
            tags: ["Units"],
            summary: "List units by exhibition",
            params: {
              type: "object",
              required: ["ex_id"],
              properties: {
                ex_id: { type: "integer", minimum: 1, example: 42 },
              },
            },
            response: {
              200: {
                type: "array",
                items: { $ref: "Unit#" },
                example: [
                  {
                    unit_id: 105,
                    exhibition_id: 42,
                    unit_name: "AI Playground",
                    unit_type: "booth",
                    description: "Interactive demos of AI gadgets.",
                    staff_user_id: 13,
                    poster_url: "uploads/units/ai-playground.png",
                    starts_at: "2024-05-01T10:00:00Z",
                    ends_at: "2024-05-01T18:00:00Z",
                  },
                ],
              },
            },
          },
        },
        async (req: FastifyRequest<{ Params: { ex_id: string } }>) => {
          return await getUnitsByExhibitionId(req.params.ex_id);
        }
      );

      fastify.get(
        "/units/:id",
        {
          schema: {
            tags: ["Units"],
            summary: "Get unit",
            params: {
              type: "object",
              required: ["ex_id", "id"],
              properties: {
                ex_id: { type: "integer", minimum: 1, example: 42 },
                id: { type: "integer", minimum: 1, example: 105 },
              },
            },
            response: {
              200: {
                type: "array",
                items: { $ref: "Unit#" },
                example: [
                  {
                    unit_id: 105,
                    exhibition_id: 42,
                    unit_name: "AI Playground",
                    unit_type: "booth",
                    description: "Interactive demos of AI gadgets.",
                    staff_user_id: 13,
                    poster_url: "uploads/units/ai-playground.png",
                    starts_at: "2024-05-01T10:00:00Z",
                    ends_at: "2024-05-01T18:00:00Z",
                  },
                ],
              },
            },
          },
        },
        async (req: FastifyRequest<{ Params: { ex_id: string; id: string } }>) => {
          return await getUnitsById(req.params.ex_id, req.params.id);
        }
      );

      fastify.post(
        "/units",
        {
          attachValidation: true,
          schema: {
            tags: ["Units"],
            summary: "Create unit",
            params: {
              type: "object",
              required: ["ex_id"],
              properties: {
                ex_id: { type: "integer", minimum: 1, example: 42 },
              },
            },
            body: { $ref: "CreateUnitInput#" },
            response: {
              201: {
                $ref: "Unit#",
              },
            },
          },
        },
        async (
          req: FastifyRequest<{
            Params: { ex_id: string };
            Body: unknown;
          }>,
          reply: FastifyReply
        ) => {
          if (req.validationError && !req.isMultipart()) {
            throw req.validationError;
          }
          const payload = req.isMultipart()
            ? await parseMultipartPayload(req)
            : buildCreatePayload(req.params.ex_id, req.body);

          const unit = await addUnit(payload);
          reply.code(201);
          return unit;
        }
      );

      fastify.put(
        "/units/:id",
        {
          attachValidation: true,
          schema: {
            tags: ["Units"],
            summary: "Update unit",
            params: {
              type: "object",
              required: ["ex_id", "id"],
              properties: {
                ex_id: { type: "integer", minimum: 1, example: 42 },
                id: { type: "integer", minimum: 1, example: 105 },
              },
            },
            body: { $ref: "UpdateUnitInput#" },
            response: {
              200: {
                $ref: "Unit#",
              },
            },
          },
        },
        async (
          req: FastifyRequest<{
            Params: { ex_id: string; id: string };
            Body: unknown;
          }>,
          reply: FastifyReply
        ) => {
          if (req.validationError && !req.isMultipart()) {
            throw req.validationError;
          }

          const payload = req.isMultipart()
            ? await parseMultipartUpdatePayload(req)
            : buildUpdatePayload(req.body);

          const unit = await updateUnit(req.params.ex_id, req.params.id, payload);
          reply.code(200);
          return unit;
        }
      );

      fastify.delete(
        "/units/:id",
        {
          schema: {
            tags: ["Units"],
            summary: "Delete unit",
            params: {
              type: "object",
              required: ["ex_id", "id"],
              properties: {
                ex_id: { type: "integer", minimum: 1, example: 42 },
                id: { type: "integer", minimum: 1, example: 105 },
              },
            },
            response: {
              204: {
                type: "null",
                description: "Unit deleted",
              },
            },
          },
        },
        async (req: FastifyRequest<{ Params: { ex_id: string; id: string } }>, reply: FastifyReply) => {
          await deleteUnit(req.params.ex_id, req.params.id);
          reply.code(204);
        }
      );
    },
    { prefix: "/:ex_id" }
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const unitsDir = path.resolve(__dirname, "../../uploads/units");

async function parseMultipartPayload(
  req: FastifyRequest<{ Params: { ex_id: string } }>
): Promise<AddUnitPayload> {
  const { fields, files } = await collectMultipartFields(req, {
    fileFields: {
      poster_url: {
        save: {
          targetDir: unitsDir,
          publicPrefix: "uploads/units",
          fallbackName: "poster",
        },
      },
    },
  });

  const savedPosterPath = files.poster_url?.publicPath;
  if (savedPosterPath) {
    fields.poster_url = savedPosterPath;
  }

  return buildCreatePayload(req.params.ex_id, fields);
}

function buildCreatePayload(exhibitionIdParam: string, source: unknown): AddUnitPayload {
  const exhibitionId = Number(exhibitionIdParam);
  if (!Number.isInteger(exhibitionId)) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }

  if (!source || typeof source !== "object") {
    throw new AppError("request body is required", 400, "VALIDATION_ERROR");
  }

  const fields = source as Record<string, unknown>;
  const getString = (key: string): string | undefined => {
    const value = fields[key];
    if (value === undefined || value === null) {
      return undefined;
    }
    return typeof value === "string" ? value : String(value);
  };

  const unitName = getString("unit_name")?.trim();
  if (!unitName) {
    throw new AppError("unit_name is required", 400, "VALIDATION_ERROR");
  }

  const rawUnitType = getString("unit_type")?.toLowerCase();
  if (!rawUnitType || !UNIT_TYPES.includes(rawUnitType as UnitType)) {
    throw new AppError("invalid unit_type", 400, "VALIDATION_ERROR");
  }

  const payload: AddUnitPayload = {
    exhibition_id: exhibitionId,
    unit_name: unitName,
    unit_type: rawUnitType as UnitType,
  };

  const description = getString("description");
  if (description !== undefined) {
    payload.description = description || null;
  }

  const descriptionDelta = parseJsonDelta(fields.description_delta, "description_delta");
  if (descriptionDelta !== undefined) {
    payload.description_delta = descriptionDelta;
  }

  const staffUserIdRaw = getString("staff_user_id");
  if (staffUserIdRaw !== undefined) {
    if (!staffUserIdRaw) {
      payload.staff_user_id = null;
    } else {
      const staffUserId = Number(staffUserIdRaw);
      if (!Number.isInteger(staffUserId)) {
        throw new AppError("staff_user_id must be an integer", 400, "VALIDATION_ERROR");
      }
      payload.staff_user_id = staffUserId;
    }
  }

  const posterUrl = getString("poster_url");
  if (posterUrl !== undefined) {
    payload.poster_url = posterUrl || null;
  }

  const startsAt = getString("starts_at");
  if (startsAt !== undefined) {
    payload.starts_at = startsAt || null;
  }

  const endsAt = getString("ends_at");
  if (endsAt !== undefined) {
    payload.ends_at = endsAt || null;
  }

  return payload;
}



async function parseMultipartUpdatePayload(
  req: FastifyRequest<{ Params: { ex_id: string; id: string } }>
): Promise<UpdateUnitPayload> {
  const { fields, files } = await collectMultipartFields(req, {
    fileFields: {
      poster_url: {
        save: {
          targetDir: unitsDir,
          publicPrefix: "uploads/units",
          fallbackName: "poster",
        },
      },
    },
  });

  const savedPosterPath = files.poster_url?.publicPath;
  if (savedPosterPath) {
    fields.poster_url = savedPosterPath;
  }

  return buildUpdatePayload(fields);
}

function buildUpdatePayload(source: unknown): UpdateUnitPayload {
  if (!source || typeof source !== "object") {
    throw new AppError("request body is required", 400, "VALIDATION_ERROR");
  }

  const fields = source as Record<string, unknown>;
  const payload: UpdateUnitPayload = {};
  let touched = 0;

  const hasField = (key: string) => Object.prototype.hasOwnProperty.call(fields, key);

  if (hasField("unit_name")) {
    const raw = fields["unit_name"];
    if (raw === null || raw === undefined) {
      throw new AppError("unit_name cannot be null", 400, "VALIDATION_ERROR");
    }
    const value = (typeof raw === "string" ? raw : String(raw)).trim();
    if (!value) {
      throw new AppError("unit_name is required when provided", 400, "VALIDATION_ERROR");
    }
    payload.unit_name = value;
    touched++;
  }

  if (hasField("unit_type")) {
    const raw = fields["unit_type"];
    if (raw === null || raw === undefined) {
      throw new AppError("unit_type cannot be null", 400, "VALIDATION_ERROR");
    }
    const value = typeof raw === "string" ? raw : String(raw);
    const normalised = value.trim().toLowerCase();
    if (!normalised || !UNIT_TYPES.includes(normalised as UnitType)) {
      throw new AppError("invalid unit_type", 400, "VALIDATION_ERROR");
    }
    payload.unit_type = normalised as UnitType;
    touched++;
  }

  if (hasField("description")) {
    const raw = fields["description"];
    if (raw === null || raw === undefined) {
      payload.description = null;
    } else {
      const value = typeof raw === "string" ? raw : String(raw);
      payload.description = value ? value : null;
    }
    touched++;
  }

  if (hasField("description_delta")) {
    const parsed = parseJsonDelta(fields.description_delta, "description_delta");
    if (parsed !== undefined) {
      payload.description_delta = parsed;
      touched++;
    }
  }

  const setNullableString = (
    key: keyof Pick<UpdateUnitPayload, "poster_url" | "starts_at" | "ends_at">
  ) => {
    if (!hasField(key)) {
      return;
    }
    const raw = fields[key as string];
    if (raw === null || raw === undefined) {
      (payload as Record<string, unknown>)[key as string] = null;
    } else {
      const value = typeof raw === "string" ? raw : String(raw);
      (payload as Record<string, unknown>)[key as string] = value ? value : null;
    }
    touched++;
  };

  setNullableString("poster_url");
  setNullableString("starts_at");
  setNullableString("ends_at");

  if (!touched) {
    throw new AppError("no fields to update", 400, "VALIDATION_ERROR");
  }

  return payload;
}
