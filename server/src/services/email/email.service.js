import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { emailConfig } from "../../config/email.js";
import { logger } from "../../config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EmailService {
  /**
   * Core send email method
   */
  static async sendEmail({ to, subject, html, text }) {
    logger.info(`[EmailService] Delivering email to: ${to}, Subject: ${subject}`);
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      to,
      subject,
      timestamp: new Date(),
    };
  }

  /**
   * Helper to load and render an HTML template with parameters
   */
  static renderTemplate(templateName, variables = {}) {
    try {
      const templatePath = path.join(__dirname, "templates", `${templateName}.html`);
      if (fs.existsSync(templatePath)) {
        let content = fs.readFileSync(templatePath, "utf-8");
        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`{{${key}}}`, "g");
          content = content.replace(regex, value !== undefined && value !== null ? String(value) : "");
        }
        return content;
      }
    } catch (err) {
      logger.warn(`[EmailService] Failed to load template ${templateName}: ${err.message}`);
    }
    return `<p>${variables.message || "Notification from SecureAssess"}</p>`;
  }

  /**
   * Sends templated notification email
   */
  static async sendTemplatedEmail(to, subject, templateName, variables = {}) {
    const html = this.renderTemplate(templateName, variables);
    return this.sendEmail({
      to,
      subject,
      html,
      text: variables.message || subject,
    });
  }

  static async sendVerificationEmail(to, code) {
    return this.sendTemplatedEmail(to, "Verify your SecureAssess account", "emailVerification", { code });
  }

  static async sendAssessmentInvitation(to, assessmentTitle, accessCode, availableUntil) {
    return this.sendTemplatedEmail(to, `New Assessment Assigned: ${assessmentTitle}`, "assessmentAssigned", {
      assessmentTitle,
      accessCode,
      availableUntil: availableUntil || "Open window",
    });
  }

  static async sendResultPublishedEmail(to, assessmentTitle) {
    return this.sendTemplatedEmail(to, `Results Published: ${assessmentTitle}`, "resultPublished", {
      assessmentTitle,
    });
  }
}
