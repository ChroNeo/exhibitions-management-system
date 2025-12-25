import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyRequest } from "fastify";
import { AppError } from "../errors.js";
import { UNIT_TYPES, type AddUnitPayload, type UnitType, type UpdateUnitPayload } from "../models/unit_model.js";
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

  const descriptionDelta = parseJsonField(fields.description_delta, "description_delta");
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

  const staffUserIdsValue = parseStaffIds(fields["staff_user_ids"], "staff_user_ids");
  if (staffUserIdsValue !== undefined) {
    payload.staff_user_ids = staffUserIdsValue;
  }

  if (payload.staff_user_ids !== undefined) {
    payload.staff_user_id = payload.staff_user_ids.length ? payload.staff_user_ids[0] : null;
  } else if (payload.staff_user_id !== undefined) {
    payload.staff_user_ids = payload.staff_user_id === null ? [] : [payload.staff_user_id];
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

  return payload;
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
    const parsed = parseJsonField(fields.description_delta, "description_delta");
    if (parsed !== undefined) {
      payload.description_delta = parsed;
      touched++;
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
    touched++;
  };

  setNullableString("poster_url");
  setNullableString("detail_pdf_url");
  setNullableString("starts_at");
  setNullableString("ends_at");

  if (hasField("staff_user_id")) {
    const raw = fields["staff_user_id"];
    if (raw === null || raw === undefined || (typeof raw === "string" && !raw.trim())) {
      payload.staff_user_id = null;
      payload.staff_user_ids = [];
    } else {
      const numeric = Number(typeof raw === "string" ? raw.trim() : raw);
      if (!Number.isFinite(numeric) || !Number.isInteger(numeric) || numeric <= 0) {
        throw new AppError("staff_user_id must be an integer", 400, "VALIDATION_ERROR");
      }
      payload.staff_user_id = numeric;
      payload.staff_user_ids = [numeric];
    }
    touched++;
  }

  if (hasField("staff_user_ids")) {
    const parsed = parseStaffIds(fields["staff_user_ids"], "staff_user_ids");
    if (parsed !== undefined) {
      payload.staff_user_ids = parsed;
      payload.staff_user_id = parsed.length ? parsed[0] : null;
    }
    touched++;
  }

  if (!touched) {
    throw new AppError("no fields to update", 400, "VALIDATION_ERROR");
  }

  return payload;
}
