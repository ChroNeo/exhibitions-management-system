import type { FastifyInstance, FastifyRequest } from "fastify";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AppError } from "../errors.js";
import { getUnitsByExhibitionId, getUnitsById } from "../queries/units-query.js";
import { collectMultipartFields } from "../services/file-upload.js";
import { UNIT_TYPES, type AddUnitPayload, type UnitType } from "../models/unit_model.js";

export default async function unitsController(fastify: FastifyInstance) {
  await fastify.register(
    async (fastify) => {
      fastify.get(
        "/units",
        async (req: FastifyRequest<{ Params: { ex_id: string } }>) => {
          return await getUnitsByExhibitionId(req.params.ex_id);
        }
      );

      fastify.get(
        "/units/:id",
        async (req: FastifyRequest<{ Params: { ex_id: string; id: string } }>) => {
          return await getUnitsById(req.params.ex_id, req.params.id);
        }
      );

      fastify.post(
        "/units",
        async (
          req: FastifyRequest<{
            Params: { ex_id: string };
            Body: unknown;
          }>
        ) => {
          const payload = req.isMultipart()
            ? await parseMultipartPayload(req)
            : buildCreatePayload(req.params.ex_id, req.body);

          return payload;
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
