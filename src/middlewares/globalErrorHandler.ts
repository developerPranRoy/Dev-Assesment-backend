import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import ApiError from "../shared/ApiError";
import config from "../config";
import logger from "../shared/logger";

const globalErrorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errors: unknown[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation error";
    errors = err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      message = `Duplicate value for ${(err.meta?.target as string[] | undefined)?.join(", ") ?? "field"}`;
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found";
    } else if (err.code === "P2003") {
      statusCode = 400;
      message = "Referenced record does not exist";
    } else {
      statusCode = 400;
      message = "Database request error";
    }
  } else if (err instanceof Error) {
    message = err.message || message;
  }

  if (statusCode >= 500) {
    logger.error({ err, method: req.method, url: req.originalUrl, statusCode }, "server_error");
  } else if (statusCode >= 400) {
    logger.warn({ message, method: req.method, url: req.originalUrl, statusCode }, "client_error");
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(config.env === "development" && err instanceof Error ? { stack: err.stack } : {}),
  });
};

export default globalErrorHandler;
