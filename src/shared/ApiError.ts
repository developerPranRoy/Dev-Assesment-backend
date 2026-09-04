class ApiError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string, stack?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
