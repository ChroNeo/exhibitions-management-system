import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Writable } from "node:stream";
import type { MultipartFile } from "@fastify/multipart";

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
  const filename = `EXP${timestamp}${extension}`;
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

