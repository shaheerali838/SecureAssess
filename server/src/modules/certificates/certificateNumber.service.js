import crypto from "crypto";
import Certificate from "./certificate.model.js";

const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export class CertificateNumberService {
  /**
   * Generates sequential human-readable certificate number: SA-YYYY-XXXXXX
   */
  static async generateCertificateNumber() {
    const year = new Date().getFullYear();
    const prefix = `SA-${year}-`;

    const latestCert = await Certificate.findOne({
      certificateNumber: new RegExp(`^${prefix}`),
    })
      .sort({ createdAt: -1 })
      .lean();

    let seq = 1;
    if (latestCert && latestCert.certificateNumber) {
      const match = latestCert.certificateNumber.match(new RegExp(`^${prefix}(\\d+)`));
      if (match && match[1]) {
        seq = parseInt(match[1], 10) + 1;
      }
    }

    const seqPadded = String(seq).padStart(6, "0");
    return `${prefix}${seqPadded}`;
  }

  /**
   * Generates cryptographically secure, non-sequential verification code: XXXX-XXXX-XXXX
   */
  static generateVerificationCode() {
    const bytes = crypto.randomBytes(12);
    let code = "";
    for (let i = 0; i < 12; i++) {
      code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
    }
    return `${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 12)}`;
  }
}
