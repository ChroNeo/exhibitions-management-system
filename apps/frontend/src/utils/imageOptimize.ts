/**
 * Convert an image File to WebP format with optional max-dimension resizing.
 *
 * Falls back to the original file when:
 * - The file is already WebP
 * - The browser doesn't support WebP canvas encoding
 * - The converted result is somehow larger than the original
 */
export async function optimizeImage(
  file: File,
  {
    maxDimension = 1920,
    quality = 0.82,
  }: { maxDimension?: number; quality?: number } = {},
): Promise<File> {
  if (file.type === "image/webp") return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  // Determine output dimensions (cap to maxDimension, keep aspect ratio)
  let outW = width;
  let outH = height;
  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      outW = maxDimension;
      outH = Math.round((height / width) * maxDimension);
    } else {
      outH = maxDimension;
      outW = Math.round((width / height) * maxDimension);
    }
  }

  const canvas = new OffscreenCanvas(outW, outH);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, outW, outH);
  bitmap.close();

  let blob: Blob;
  try {
    blob = await canvas.convertToBlob({ type: "image/webp", quality });
  } catch {
    // Browser doesn't support WebP encoding — return original
    return file;
  }

  // If the converted file is larger, keep the original
  if (blob.size >= file.size) return file;

  const name = file.name.replace(/\.[^.]+$/, ".webp");
  return new File([blob], name, { type: "image/webp" });
}
