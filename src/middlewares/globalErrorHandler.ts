import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import ApiError from "../shared/ApiError";
import config from "../config";

const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errors: unknown[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation error";
    errors = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      message = `Duplicate value for ${
        (err.meta?.target as string[])?.join(", ") ?? "field"
      }`;
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found";
    } else {
      statusCode = 400;
      message = "Database request error";
    }
  } else if (err instanceof Error) {
    message = err.message || message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(config.env === "development" && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
};

export default globalErrorHandler;
