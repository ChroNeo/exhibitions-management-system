import { AppError } from "../errors.js";

/**
 * Parses and validates a JSON field from multipart form data or request body
 * @param value - The value to parse (can be string, object, null, or undefined)
 * @param fieldName - The name of the field for error messages
 * @returns Validated JSON string, null, or undefined
 */
export function parseJsonField(
  value: unknown,
  fieldName: string
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.length) return null;
    try {
      JSON.parse(trimmed);
    } catch {
      throw new AppError(`${fieldName} must be valid JSON`, 400, "VALIDATION_ERROR");
    }
    return trimmed;
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      throw new AppError(`${fieldName} must be valid JSON`, 400, "VALIDATION_ERROR");
    }
  }

  throw new AppError(`${fieldName} must be valid JSON`, 400, "VALIDATION_ERROR");
}

/**
 * Parses an array of staff IDs from various input formats
 * Supports: array, comma-separated string, JSON array string, or single number
 * @param value - The value to parse
 * @param fieldName - The name of the field for error messages
 * @returns Array of unique positive integers, or undefined if not provided
 */
export function parseStaffIds(
  value: unknown,
  fieldName: string
): number[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return [];
  }

  let rawValues: unknown[];

  if (Array.isArray(value)) {
    rawValues = value;
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        rawValues = parsed;
      } else {
        rawValues = trimmed.split(",").map((part) => part.trim()).filter(Boolean);
      }
    } catch {
      rawValues = trimmed.split(",").map((part) => part.trim()).filter(Boolean);
    }
  } else if (typeof value === "number") {
    rawValues = [value];
  } else {
    throw new AppError(
      `${fieldName} must be an array of integers`,
      400,
      "VALIDATION_ERROR"
    );
  }

  const numbers: number[] = [];
  for (const entry of rawValues) {
    if (entry === null || entry === undefined) {
      continue;
    }
    if (typeof entry === "string" && !entry.trim()) {
      continue;
    }
    const numericValue =
      typeof entry === "number"
        ? entry
        : Number(typeof entry === "string" ? entry.trim() : String(entry));
    if (
      !Number.isFinite(numericValue) ||
      !Number.isInteger(numericValue) ||
      numericValue <= 0
    ) {
      throw new AppError(
        `${fieldName} must contain positive integers`,
        400,
        "VALIDATION_ERROR"
      );
    }
    numbers.push(numericValue);
  }

  return Array.from(new Set(numbers));
}
