import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyRequest } from "fastify";
import { AppError } from "../errors.js";
import {
  EXHIBITION_STATUSES,
  type AddExhibitionPayload,
  type UpdateExhibitionPayload,
  type ExhibitionStatus,
} from "../models/exhibition.model.js";
import { collectMultipartFields } from "./file-upload.js";
import { parseJsonField } from "../utils/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const exhibitionsDir = path.resolve(__dirname, "../../uploads/exhibitions");

export async function parseMultipartPayload(
  req: FastifyRequest,
  mode: "create"
): Promise<AddExhibitionPayload>;
export async function parseMultipartPayload(
  req: FastifyRequest,
  mode: "update"
): Promise<UpdateExhibitionPayload>;
export async function parseMultipartPayload(
  req: FastifyRequest,
  mode: "create" | "update" = "create"
): Promise<AddExhibitionPayload | UpdateExhibitionPayload> {
  const { fields, files } = await collectMultipartFields(req, {
    fileFields: {
      picture_path: {
        save: {
          targetDir: exhibitionsDir,
          publicPrefix: "uploads/exhibitions",
          fallbackName: "asset",
        },
      },
    },
  });

  const savedPicturePath = files.picture_path?.publicPath;
  if (savedPicturePath) {
    fields.picture_path = savedPicturePath;
  }

  return mode === "create"
    ? normaliseCreatePayload(fields)
    : buildUpdatePayload(fields);
}

export function normaliseCreatePayload(fields: Record<string, string>): Omit<AddExhibitionPayload, "created_by"> {
  const rawStatus = fields.status?.toLowerCase();
  const status = rawStatus as AddExhibitionPayload["status"] | undefined;
  if (status && !EXHIBITION_STATUSES.includes(status)) {
    throw new AppError("invalid status value", 400, "VALIDATION_ERROR");
  }

  const requiredFields: Array<
    keyof Omit<
      AddExhibitionPayload,
      "description" | "description_delta" | "location" | "picture_path" | "status" | "created_by"
    >
  > = [
    "title",
    "start_date",
    "end_date",
    "organizer_name",
  ];
  const missing = requiredFields.filter((field) => !fields[field]);
  if (missing.length) {
    throw new AppError(
      `missing required fields: ${missing.join(", ")}`,
      400,
      "VALIDATION_ERROR"
    );
  }

  return {
    title: fields.title ?? "",
    description: fields.description || undefined,
    description_delta: parseJsonField(fields.description_delta, "description_delta") ?? undefined,
    start_date: fields.start_date ?? "",
    end_date: fields.end_date ?? "",
    location: fields.location || undefined,
    organizer_name: fields.organizer_name ?? "",
    picture_path: fields.picture_path || undefined,
    status,
  };
}

export function buildUpdatePayload(source: unknown): UpdateExhibitionPayload {
  if (!source || typeof source !== "object") {
    throw new AppError("request body is required", 400, "VALIDATION_ERROR");
  }

  const fields = source as Record<string, unknown>;
  const payload: UpdateExhibitionPayload = {};
  let accepted = 0;

  const hasField = (key: string) => Object.prototype.hasOwnProperty.call(fields, key);
  const assignStringField = (
    key: keyof UpdateExhibitionPayload,
    { allowNull, allowEmpty, treatEmptyAsNull }: { allowNull: boolean; allowEmpty: boolean; treatEmptyAsNull: boolean }
  ) => {
    if (!hasField(key)) {
      return;
    }

    const raw = fields[key as string];
    if (raw === undefined) {
      return;
    }

    if (raw === null) {
      if (!allowNull) {
        throw new AppError(`${key} cannot be null`, 400, "VALIDATION_ERROR");
      }
      (payload as Record<string, unknown>)[key as string] = null;
      accepted++;
      return;
    }

    const value = typeof raw === "string" ? raw : String(raw);
    if (!allowEmpty && !value) {
      throw new AppError(`${key} is required when provided`, 400, "VALIDATION_ERROR");
    }

    if (!value && treatEmptyAsNull) {
      (payload as Record<string, unknown>)[key as string] = null;
    } else {
      (payload as Record<string, unknown>)[key as string] = value;
    }
    accepted++;
  };

  assignStringField("title", { allowNull: false, allowEmpty: false, treatEmptyAsNull: false });
  assignStringField("start_date", { allowNull: false, allowEmpty: false, treatEmptyAsNull: false });
  assignStringField("end_date", { allowNull: false, allowEmpty: false, treatEmptyAsNull: false });
  assignStringField("organizer_name", {
    allowNull: false,
    allowEmpty: false,
    treatEmptyAsNull: false,
  });
  assignStringField("description", { allowNull: true, allowEmpty: true, treatEmptyAsNull: true });

  if (hasField("description_delta")) {
    const parsed = parseJsonField(fields.description_delta, "description_delta");
    if (parsed !== undefined) {
      payload.description_delta = parsed;
      accepted++;
    }
  }

  assignStringField("location", { allowNull: true, allowEmpty: true, treatEmptyAsNull: true });
  assignStringField("picture_path", {
    allowNull: true,
    allowEmpty: true,
    treatEmptyAsNull: true,
  });

  if (hasField("status")) {
    const raw = fields.status;
    if (raw === undefined) {
      // ignore undefined
    } else {
      if (raw === null) {
        throw new AppError("status cannot be null", 400, "VALIDATION_ERROR");
      }
      const value = typeof raw === "string" ? raw : String(raw);
      if (!value) {
        throw new AppError("status is required when provided", 400, "VALIDATION_ERROR");
      }
      const normalised = value.toLowerCase();
      if (!EXHIBITION_STATUSES.includes(normalised as ExhibitionStatus)) {
        throw new AppError("invalid status value", 400, "VALIDATION_ERROR");
      }
      payload.status = normalised as ExhibitionStatus;
      accepted++;
    }
  }

  if (!accepted) {
    throw new AppError("no fields to update", 400, "VALIDATION_ERROR");
  }

  return payload;
}
