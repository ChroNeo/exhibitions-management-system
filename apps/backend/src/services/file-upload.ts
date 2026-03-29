import type { MultipartFile, MultipartValue } from "@fastify/multipart";
import type { FastifyBaseLogger, FastifyRequest } from "fastify";
import { createWriteStream } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { AppError } from "../errors.js";

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".pdf",
]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

const IMAGE_MAX_DIMENSION = 1920;
const IMAGE_WEBP_QUALITY = 82;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

export interface SaveMultipartFileOptions {
  /** Absolute directory where the file should be stored */
  targetDir: string;
  /** Path (POSIX style) to prepend to the returned relative path */
  publicPrefix?: string;
  /** Fallback filename when the uploaded part has no original name */
  fallbackName?: string;
  /** Custom prefix for the filename (defaults to EXP or EXP_PDF based on extension) */
  filenamePrefix?: string;
  /** Keep original image bytes and extension (skip resize/convert to WebP) */
  preserveOriginalImage?: boolean;
}

export interface SavedMultipartFile {
  filename: string;
  absolutePath: string;
  /** Optional relative path that can be persisted or exposed */
  publicPath?: string;
}

export async function saveMultipartFile(
  part: MultipartFile,
  {
    targetDir,
    publicPrefix,
    fallbackName = "file",
    filenamePrefix,
    preserveOriginalImage = false,
  }: SaveMultipartFileOptions,
): Promise<SavedMultipartFile> {
  await mkdir(targetDir, { recursive: true });
  const originalName = sanitizeFilename(part.filename ?? fallbackName);
  const extension = path.extname(originalName).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    if (!part.file.readableEnded) part.file.resume();
    throw new AppError(
      `File type '${extension}' is not allowed. Allowed types: ${[...ALLOWED_EXTENSIONS].join(", ")}`,
      400,
      "INVALID_FILE_TYPE",
    );
  }

  if (part.mimetype && !ALLOWED_MIME_TYPES.has(part.mimetype)) {
    if (!part.file.readableEnded) part.file.resume();
    throw new AppError(
      `MIME type '${part.mimetype}' is not allowed`,
      400,
      "INVALID_FILE_TYPE",
    );
  }
  const timestamp = Date.now();
  const prefix = filenamePrefix ?? (extension === ".pdf" ? "EXP_PDF" : "EXP");
  const isImage = IMAGE_EXTENSIONS.has(extension);

  if (isImage && !preserveOriginalImage) {
    // Buffer the stream, optimize with sharp, save as WebP
    const chunks: Buffer[] = [];
    for await (const chunk of part.file) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const raw = Buffer.concat(chunks);

    const optimized = await sharp(raw)
      .resize(IMAGE_MAX_DIMENSION, IMAGE_MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: IMAGE_WEBP_QUALITY })
      .toBuffer();

    const outFilename = `${prefix}${timestamp}.webp`;
    const absolutePath = path.join(targetDir, outFilename);
    await writeFile(absolutePath, optimized);

    const publicPath = publicPrefix
      ? path.posix.join(normalizeToPosix(publicPrefix), outFilename)
      : undefined;

    return { filename: outFilename, absolutePath, publicPath };
  }

  // Non-image files (PDF etc.) or preserved images — stream directly to disk
  const filename = `${prefix}${timestamp}${extension}`;
  const absolutePath = path.join(targetDir, filename);
  await pipeline(part.file, createWriteStream(absolutePath));

  const publicPath = publicPrefix
    ? path.posix.join(normalizeToPosix(publicPrefix), filename)
    : undefined;

  return { filename, absolutePath, publicPath };
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
    }),
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
  {
    fileFields = {},
    drainUnknownFiles = true,
  }: CollectMultipartFieldsOptions = {},
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
    const value =
      typeof rawValue === "string" ? rawValue : String(rawValue ?? "");
    fields[part.fieldname] = value;
  }

  return { fields, files };
}

export function isFilePart(
  part: MultipartFile | MultipartValue,
): part is MultipartFile {
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
  log?: FastifyBaseLogger,
): Promise<void> {
  if (!publicPath) return;
  const normalized = publicPath.replace(/\\/g, "/").split("?")[0];
  if (!normalized.startsWith("uploads/")) {
    return;
  }
  const relative = normalized.slice("uploads/".length);
  const absolute = path.resolve(uploadsRoot, relative);
  if (!absolute.startsWith(uploadsRoot)) {
    log?.warn(
      { path: normalized },
      "Skip removing uploaded file outside uploads directory",
    );
    return;
  }
  try {
    await unlink(absolute);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    if (code !== "ENOENT") {
      log?.error(
        { err: error, path: normalized },
        "Failed to remove uploaded file",
      );
    }
  }
}
