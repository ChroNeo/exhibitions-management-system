import { getExhibitionsList, getExhibitionById, addExhibitions } from "../queries/exhibitions.js";
import type { AddExhibitionPayload } from "../models/exhibition.js";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { MultipartFile, MultipartValue } from "@fastify/multipart";
import { AppError } from "../errors.js";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { Writable } from "node:stream";
import path from "node:path";
import { fileURLToPath } from "node:url";

export default async function exhibitionsRoutes(fastify: FastifyInstance) {
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
        ? await parseMultipartPayload(req)
        : (req.body as AddExhibitionPayload | undefined);

      if (!payload) {
        throw new AppError("request body is required", 400, "VALIDATION_ERROR");
      }

      const exhibition = await addExhibitions(payload);
      reply.code(201);
      return exhibition;
    }
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const exhibitionsDir = path.resolve(__dirname, "../../uploads/exhibitions");

async function parseMultipartPayload(req: FastifyRequest): Promise<AddExhibitionPayload> {
  const fields: Record<string, string> = {};
  let savedPicturePath: string | undefined;

  for await (const part of req.parts()) {
    if (isFilePart(part)) {
      if (part.fieldname === "picture_path") {
        savedPicturePath = await persistExhibitionFile(part);
      } else {
        await drainStream(part);
      }
      continue;
    }

    const rawValue = part.value;
    const value = typeof rawValue === "string" ? rawValue : String(rawValue ?? "");
    fields[part.fieldname] = value;
  }

  if (savedPicturePath) {
    fields.picture_path = savedPicturePath;
  }

  return normalisePayload(fields);
}

function isFilePart(part: MultipartFile | MultipartValue): part is MultipartFile {
  return (part as MultipartFile).type === "file";
}

async function persistExhibitionFile(part: MultipartFile): Promise<string> {
  await mkdir(exhibitionsDir, { recursive: true });
  const filename = `${Date.now()}-${sanitizeFilename(part.filename ?? "asset")}`;
  const targetPath = path.join(exhibitionsDir, filename);
  await pipeline(part.file, createWriteStream(targetPath));
  return path.posix.join("uploads", "exhibitions", filename);
}

async function drainStream(part: MultipartFile) {
  if (part.file.readableEnded) {
    return;
  }
  await pipeline(
    part.file,
    new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    })
  );
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

function normalisePayload(fields: Record<string, string>): AddExhibitionPayload {
  const createdByRaw = fields.created_by;
  const createdBy = Number(createdByRaw);

  if (!Number.isInteger(createdBy)) {
    throw new AppError("created_by must be an integer", 400, "VALIDATION_ERROR");
  }

  const statuses: Array<NonNullable<AddExhibitionPayload["status"]>> = [
    "draft",
    "published",
    "ongoing",
    "ended",
    "archived",
  ];

  const rawStatus = fields.status?.toLowerCase();
  const status = rawStatus as AddExhibitionPayload["status"] | undefined;
  if (status && !statuses.includes(status)) {
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
