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
