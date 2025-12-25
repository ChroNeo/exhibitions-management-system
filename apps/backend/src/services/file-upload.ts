import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Writable } from "node:stream";
import type { MultipartFile, MultipartValue } from "@fastify/multipart";
import type { FastifyRequest, FastifyBaseLogger } from "fastify";
import { fileURLToPath } from "node:url";

export interface SaveMultipartFileOptions {
  /** Absolute directory where the file should be stored */
  targetDir: string;
  /** Path (POSIX style) to prepend to the returned relative path */
  publicPrefix?: string;
  /** Fallback filename when the uploaded part has no original name */
  fallbackName?: string;
}

export interface SavedMultipartFile {
  filename: string;
  absolutePath: string;
  /** Optional relative path that can be persisted or exposed */
  publicPath?: string;
}

export async function saveMultipartFile(
  part: MultipartFile,
  { targetDir, publicPrefix, fallbackName = "file" }: SaveMultipartFileOptions
): Promise<SavedMultipartFile> {
  await mkdir(targetDir, { recursive: true });
  const originalName = sanitizeFilename(part.filename ?? fallbackName);
  const extension = path.extname(originalName);
  const timestamp = Date.now();
  const prefix = extension.toLowerCase() === ".pdf" ? "EXP_PDF" : "EXP";
  const filename = `${prefix}${timestamp}${extension}`;
  const absolutePath = path.join(targetDir, filename);
  await pipeline(part.file, createWriteStream(absolutePath));

  const publicPath = publicPrefix
    ? path.posix.join(normalizeToPosix(publicPrefix), filename)
    : undefined;

  return {
    filename,
    absolutePath,
    publicPath,
  };
}

export async function drainMultipartStream(part: MultipartFile): Promise<void> {
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

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

function normalizeToPosix(segment: string): string {
  return segment.replace(/\\/g, "/");
}

export interface CollectMultipartFieldsOptions {
  fileFields?: Record<string, MultipartFileHandler>;
  drainUnknownFiles?: boolean;
}

export interface CollectedMultipartFields {
  fields: Record<string, string>;
  files: Record<string, SavedMultipartFile | undefined>;
}

export interface MultipartFileHandler {
  save?: SaveMultipartFileOptions;
  onFilePart?: (part: MultipartFile) => Promise<void> | void;
  drain?: boolean;
}

export async function collectMultipartFields(
  req: FastifyRequest,
  { fileFields = {}, drainUnknownFiles = true }: CollectMultipartFieldsOptions = {}
): Promise<CollectedMultipartFields> {
  const fields: Record<string, string> = {};
  const files: Record<string, SavedMultipartFile | undefined> = {};

  for await (const part of req.parts()) {
    if (isFilePart(part)) {
      const handler = fileFields[part.fieldname];
      if (handler?.save) {
        files[part.fieldname] = await saveMultipartFile(part, handler.save);
      } else if (handler?.onFilePart) {
        await handler.onFilePart(part);
      } else if (handler?.drain ?? drainUnknownFiles) {
        await drainMultipartStream(part);
      }
      continue;
    }

    const rawValue = part.value;
    const value = typeof rawValue === "string" ? rawValue : String(rawValue ?? "");
    fields[part.fieldname] = value;
  }

  return { fields, files };
}

export function isFilePart(part: MultipartFile | MultipartValue): part is MultipartFile {
  return (part as MultipartFile).type === "file";
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, "../../uploads");

/**
 * Safely removes an uploaded file from the uploads directory
 * @param publicPath - The public path of the file (e.g., "uploads/exhibitions/file.jpg")
 * @param log - Optional Fastify logger for logging errors
 */
export async function removeUploadedFile(
  publicPath: string | null | undefined,
  log?: FastifyBaseLogger
): Promise<void> {
  if (!publicPath) return;
  const normalized = publicPath.replace(/\\/g, "/").split("?")[0];
  if (!normalized.startsWith("uploads/")) {
    return;
  }
  const relative = normalized.slice("uploads/".length);
  const absolute = path.resolve(uploadsRoot, relative);
  if (!absolute.startsWith(uploadsRoot)) {
    log?.warn({ path: normalized }, "Skip removing uploaded file outside uploads directory");
    return;
  }
  try {
    await unlink(absolute);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    if (code !== "ENOENT") {
      log?.error({ err: error, path: normalized }, "Failed to remove uploaded file");
    }
  }
}

