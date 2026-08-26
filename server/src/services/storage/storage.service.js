import fs from "fs";
import path from "path";
import { storageConfig } from "../../config/storage.js";
import { logger } from "../../config/logger.js";

export class StorageService {
  static async uploadFile(fileBuffer, fileName, folder = "general") {
    logger.info(`[StorageService] Uploading file: ${fileName} into folder: ${folder}`);
    const destDir = path.join(storageConfig.localUploadDir, folder);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const filePath = path.join(destDir, `${Date.now()}_${fileName}`);
    await fs.promises.writeFile(filePath, fileBuffer);
    return {
      success: true,
      url: `/uploads/${folder}/${path.basename(filePath)}`,
      path: filePath,
    };
  }

  static async deleteFile(filePath) {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }
}
