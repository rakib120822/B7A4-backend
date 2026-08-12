export class AppError extends Error {
  statusCode: number;
  errorStack?: unknown;

  constructor(statusCode: number, message: string, errorStack?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errorStack = errorStack;
    Error.captureStackTrace(this, this.constructor);
  }
}
