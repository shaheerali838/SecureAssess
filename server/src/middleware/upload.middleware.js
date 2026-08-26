import { storageConfig } from "../config/storage.js";
import { ApiError } from "../utils/ApiError.js";

export const uploadMiddleware = (options = {}) => {
  return (req, res, next) => {
    // Middleware stub ready for multer or stream handling
    next();
  };
};
