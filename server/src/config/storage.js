import path from "path";

export const storageConfig = {
  provider: process.env.STORAGE_PROVIDER || "local", // 'local' | 's3' | 'cloudinary'
  localUploadDir: path.join(process.cwd(), "uploads"),
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "video/webm",
    "video/mp4",
  ],
};
