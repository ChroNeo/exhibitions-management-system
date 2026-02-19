import { z } from "zod";

export function parseOrThrow<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(
      "Schema validation failed",
      500,
      "SCHEMA_VALIDATION_ERROR",
      result.error.issues
    );
  }
  return result.data;
}

export class AppError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(
    message: string,
    status: number = 500,
    code: string = "INTERNAL_ERROR",
    details: unknown = null
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
