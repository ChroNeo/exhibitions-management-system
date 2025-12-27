import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyRequest } from "fastify";
import { AppError } from "../errors.js";
import type { AddUnitPayload, UnitType, UpdateUnitPayload } from "../models/unit.model.js";
import { collectMultipartFields } from "./file-upload.js";
import { parseJsonField, parseStaffIds } from "../utils/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, "../../uploads");
const unitsDir = path.join(uploadsRoot, "units");

export async function parseMultipartPayload(
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
      detail_pdf_url: {
        save: {
          targetDir: unitsDir,
          publicPrefix: "uploads/units",
          fallbackName: "detail",
        },
      },
    },
  });

  const savedPosterPath = files.poster_url?.publicPath;
  if (savedPosterPath) {
    fields.poster_url = savedPosterPath;
  }
  const savedPdfPath = files.detail_pdf_url?.publicPath;
  if (savedPdfPath) {
    fields.detail_pdf_url = savedPdfPath;
  }

  return buildCreatePayload(req.params.ex_id, fields);
}

export function buildCreatePayload(exhibitionIdParam: string, source: unknown): AddUnitPayload {
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

  // Data transformation/normalization (Zod will validate)
  const payload: Partial<AddUnitPayload> = {
    exhibition_id: exhibitionId,
  };

  const unitName = getString("unit_name")?.trim();
  if (unitName !== undefined) {
    payload.unit_name = unitName;
  }

  const rawUnitType = getString("unit_type")?.toLowerCase();
  if (rawUnitType !== undefined) {
    payload.unit_type = rawUnitType as UnitType;
  }

  const description = getString("description");
  if (description !== undefined) {
    payload.description = description || null;
  }

  const descriptionDelta = parseJsonField(fields.description_delta, "description_delta");
  if (descriptionDelta !== undefined) {
    payload.description_delta = descriptionDelta;
  }

  const staffUserIdsValue = parseStaffIds(fields["staff_user_ids"], "staff_user_ids");
  if (staffUserIdsValue !== undefined) {
    payload.staff_user_ids = staffUserIdsValue;
  }

  const posterUrl = getString("poster_url");
  if (posterUrl !== undefined) {
    payload.poster_url = posterUrl || null;
  }

  const detailPdfUrl = getString("detail_pdf_url");
  if (detailPdfUrl !== undefined) {
    payload.detail_pdf_url = detailPdfUrl || null;
  }

  const startsAt = getString("starts_at");
  if (startsAt !== undefined) {
    payload.starts_at = startsAt || null;
  }

  const endsAt = getString("ends_at");
  if (endsAt !== undefined) {
    payload.ends_at = endsAt || null;
  }

  return payload as AddUnitPayload;
}

export async function parseMultipartUpdatePayload(
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
      detail_pdf_url: {
        save: {
          targetDir: unitsDir,
          publicPrefix: "uploads/units",
          fallbackName: "detail",
        },
      },
    },
  });

  const savedPosterPath = files.poster_url?.publicPath;
  if (savedPosterPath) {
    fields.poster_url = savedPosterPath;
  }
  const savedPdfPath = files.detail_pdf_url?.publicPath;
  if (savedPdfPath) {
    fields.detail_pdf_url = savedPdfPath;
  }

  return buildUpdatePayload(fields);
}

export function buildUpdatePayload(source: unknown): UpdateUnitPayload {
  if (!source || typeof source !== "object") {
    throw new AppError("request body is required", 400, "VALIDATION_ERROR");
  }

  const fields = source as Record<string, unknown>;
  const payload: UpdateUnitPayload = {};

  const hasField = (key: string) => Object.prototype.hasOwnProperty.call(fields, key);

  // Data transformation/normalization (Zod will validate)
  if (hasField("unit_name")) {
    const raw = fields["unit_name"];
    const value = (typeof raw === "string" ? raw : String(raw)).trim();
    payload.unit_name = value;
  }

  if (hasField("unit_type")) {
    const raw = fields["unit_type"];
    const value = typeof raw === "string" ? raw : String(raw);
    const normalised = value.trim().toLowerCase();
    payload.unit_type = normalised as UnitType;
  }

  if (hasField("description")) {
    const raw = fields["description"];
    if (raw === null || raw === undefined) {
      payload.description = null;
    } else {
      const value = typeof raw === "string" ? raw : String(raw);
      payload.description = value ? value : null;
    }
  }

  if (hasField("description_delta")) {
    const parsed = parseJsonField(fields.description_delta, "description_delta");
    if (parsed !== undefined) {
      payload.description_delta = parsed;
    }
  }

  const setNullableString = (
    key: keyof Pick<UpdateUnitPayload, "poster_url" | "detail_pdf_url" | "starts_at" | "ends_at">
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
  };

  setNullableString("poster_url");
  setNullableString("detail_pdf_url");
  setNullableString("starts_at");
  setNullableString("ends_at");

  if (hasField("staff_user_ids")) {
    const parsed = parseStaffIds(fields["staff_user_ids"], "staff_user_ids");
    if (parsed !== undefined) {
      payload.staff_user_ids = parsed;
    }
  }

  return payload;
}
