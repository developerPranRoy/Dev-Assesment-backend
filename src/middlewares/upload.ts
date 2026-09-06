import multer from "multer";
import { Request } from "express";
import httpStatus from "http-status";
import ApiError from "../shared/ApiError";

const MAX_BYTES = 5 * 1024 * 1024;

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
  if (!allowed.includes(file.mimetype)) {
    cb(new ApiError(httpStatus.BAD_REQUEST, "Only images and PDF files are allowed"));
    return;
  }
  cb(null, true);
};

export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter,
});
