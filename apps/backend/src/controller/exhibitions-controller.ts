import {
  getExhibitionsList,
  getExhibitionById,
  addExhibitions,
  updateExhibition,
  deleteExhibition,
} from "../queries/exhibitions_query.js";
import {
  EXHIBITION_STATUSES,
  type AddExhibitionPayload,
  type UpdateExhibitionPayload,
  type ExhibitionStatus,
} from "../models/exhibition_model.js";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectMultipartFields } from "../services/file-upload.js";

export default async function exhibitionsController(fastify: FastifyInstance) {
  fastify.get("/", async () => {
    return await getExhibitionsList();
  });

  fastify.get(
    "/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>) => {
      return await getExhibitionById(req.params.id);
    }
  );
  fastify.post(
    "/",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const payload = req.isMultipart()
        ? await parseMultipartPayload(req, "create")
        : (req.body as AddExhibitionPayload | undefined);

      if (!payload) {
        throw new AppError("request body is required", 400, "VALIDATION_ERROR");
      }

      const exhibition = await addExhibitions(payload);
      reply.code(201);
      return exhibition;
    }
  );

  fastify.put(
    "/:id",
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Body: Record<string, unknown> | undefined;
      }>
    ) => {
      const payload = req.isMultipart()
        ? await parseMultipartPayload(req, "update")
        : buildUpdatePayload(req.body);

      const exhibition = await updateExhibition(req.params.id, payload);
      return exhibition;
    }
  );
  fastify.delete(
    "/:id",
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      await deleteExhibition(req.params.id);
      reply.code(204).send();
    }
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const exhibitionsDir = path.resolve(__dirname, "../../uploads/exhibitions");

async function parseMultipartPayload(
  req: FastifyRequest,
  mode: "create"
): Promise<AddExhibitionPayload>;
async function parseMultipartPayload(
  req: FastifyRequest,
  mode: "update"
): Promise<UpdateExhibitionPayload>;
async function parseMultipartPayload(
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

function normaliseCreatePayload(fields: Record<string, string>): AddExhibitionPayload {
  const createdByRaw = fields.created_by;
  const createdBy = Number(createdByRaw);

  if (!Number.isInteger(createdBy)) {
    throw new AppError("created_by must be an integer", 400, "VALIDATION_ERROR");
  }

  const rawStatus = fields.status?.toLowerCase();
  const status = rawStatus as AddExhibitionPayload["status"] | undefined;
  if (status && !EXHIBITION_STATUSES.includes(status)) {
    throw new AppError("invalid status value", 400, "VALIDATION_ERROR");
  }

  const requiredFields: Array<keyof Omit<AddExhibitionPayload, "description" | "location" | "picture_path" | "status">> = [
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
    start_date: fields.start_date ?? "",
    end_date: fields.end_date ?? "",
    location: fields.location || undefined,
    organizer_name: fields.organizer_name ?? "",
    picture_path: fields.picture_path || undefined,
    status,
    created_by: createdBy,
  };
}

function buildUpdatePayload(source: unknown): UpdateExhibitionPayload {
  if (!source || typeof source !== "object") {
    throw new AppError("request body is required", 400, "VALIDATION_ERROR");
  }

  const fields = source as Record<string, unknown>;
  const payload: UpdateExhibitionPayload = {};
  let accepted = 0;

  const hasField = (key: string) => Object.prototype.hasOwnProperty.call(fields, key);
  const assignStringField = (
    key: keyof UpdateExhibitionPayload,
    {
      allowNull,
      allowEmpty,
      treatEmptyAsNull,
    }: { allowNull: boolean; allowEmpty: boolean; treatEmptyAsNull: boolean }
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
  assignStringField("location", { allowNull: true, allowEmpty: true, treatEmptyAsNull: true });
  assignStringField("picture_path", {
    allowNull: true,
    allowEmpty: true,
    treatEmptyAsNull: true,
  });

  if (hasField("status")) {
    const raw = fields.status;
    if (raw === undefined) {
      // ignore undefined to mimic JSON.stringify removing undefined fields
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
