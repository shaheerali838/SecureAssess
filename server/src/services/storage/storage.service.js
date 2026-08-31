import fs from "fs";
import path from "path";
import crypto from "crypto";
import { storageConfig } from "../../config/storage.js";
import { logger } from "../../config/logger.js";
import { ENV } from "../../config/env.js";

const SIGNING_SECRET = ENV.JWT_SECRET || "secureassess_storage_secret_key_2026";

export class StorageService {
  /**
   * Upload public static asset
   */
  static async uploadFile(fileBuffer, fileName, folder = "general") {
    logger.info(`[StorageService] Uploading public file: ${fileName} into folder: ${folder}`);
    const destDir = path.join(storageConfig.localUploadDir, folder);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const safeName = `${Date.now()}_${path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(destDir, safeName);
    await fs.promises.writeFile(filePath, fileBuffer);
    return {
      success: true,
      url: `/uploads/${folder}/${safeName}`,
      path: filePath,
    };
  }

  /**
   * Upload private, tenant-isolated asset (proctoring evidence, reports, private certificates)
   */
  static async uploadPrivateFile(fileBuffer, fileName, organizationId, folder = "evidence") {
    const orgDir = path.join(process.cwd(), "storage", "private", String(organizationId), folder);
    if (!fs.existsSync(orgDir)) {
      fs.mkdirSync(orgDir, { recursive: true });
    }
    const safeName = `${Date.now()}_${path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(orgDir, safeName);
    await fs.promises.writeFile(filePath, fileBuffer);

    const relativeKey = `${organizationId}/${folder}/${safeName}`;
    return {
      success: true,
      objectKey: relativeKey,
      path: filePath,
    };
  }

  /**
   * Generates a short-lived cryptographically signed URL for private asset access
   */
  static generateSignedUrl(objectKey, organizationId, expiresInSeconds = 300) {
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const dataToSign = `${objectKey}:${organizationId}:${expires}`;
    const signature = crypto
      .createHmac("sha256", SIGNING_SECRET)
      .update(dataToSign)
      .digest("hex");

    return {
      url: `/api/v1/storage/private?key=${encodeURIComponent(objectKey)}&orgId=${organizationId}&expires=${expires}&signature=${signature}`,
      expiresAt: new Date(expires * 1000),
      signature,
    };
  }

  /**
   * Verifies the authenticity and expiration of a signed URL
   */
  static verifySignedUrl(objectKey, organizationId, expires, signature) {
    const now = Math.floor(Date.now() / 1000);
    if (now > Number(expires)) {
      return { valid: false, reason: "EXPIRED" };
    }

    const dataToSign = `${objectKey}:${organizationId}:${expires}`;
    const expectedSignature = crypto
      .createHmac("sha256", SIGNING_SECRET)
      .update(dataToSign)
      .digest("hex");

    const sigBuf = Buffer.from(signature || "");
    const expectedBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expectedBuf.length) {
      return { valid: false, reason: "INVALID_SIGNATURE" };
    }

    const isMatch = crypto.timingSafeEqual(sigBuf, expectedBuf);
    return { valid: isMatch, reason: isMatch ? "VALID" : "INVALID_SIGNATURE" };
  }

  static async deleteFile(filePath) {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }
}
