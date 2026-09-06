import { v2 as cloudinary } from "cloudinary";
import httpStatus from "http-status";
import config from "../config";
import ApiError from "../shared/ApiError";

const isConfigured = Boolean(
  config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

export const assertCloudinaryConfigured = () => {
  if (!isConfigured) {
    throw new ApiError(
      httpStatus.NOT_IMPLEMENTED,
      "File uploads are not configured — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET"
    );
  }
};

export const uploadBuffer = (
  buffer: Buffer,
  options: { folder: string; resourceType?: "image" | "raw" | "auto" }
) =>
  new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    assertCloudinaryConfigured();
    const stream = cloudinary.uploader.upload_stream(
      { folder: options.folder, resource_type: options.resourceType ?? "auto" },
      (err, result) => {
        if (err || !result) {
          reject(err ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
