import Result from "../modules/results/result.model.js";
import Certificate from "../modules/certificates/certificate.model.js";
import { CertificateService } from "../modules/certificates/certificate.service.js";
import { logger } from "../config/logger.js";

export const runCertificateGenerationJob = async (batchSize = 20) => {
  logger.info("[Job] Processing passed candidate certificates...");

  const passedResults = await Result.find({
    passed: true,
    published: true,
  })
    .limit(batchSize)
    .sort({ createdAt: -1 });

  let issuedCount = 0;
  for (const res of passedResults) {
    try {
      const existing = await Certificate.findOne({ resultId: res._id });
      if (!existing) {
        await CertificateService.issueCertificateForResult(
          res.organizationId,
          res._id
        );
        issuedCount++;
      }
    } catch (err) {
      logger.warn(`[Job] Certificate issuance skipped for result ${res._id}: ${err.message}`);
    }
  }

  return {
    scanned: passedResults.length,
    issued: issuedCount,
  };
};
