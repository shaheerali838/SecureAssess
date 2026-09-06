import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { emailConfig } from "../../config/email.js";
import { logger } from "../../config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const hasAuth = Boolean(emailConfig.auth?.user && emailConfig.auth?.pass);

  if (hasAuth) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host || "smtp.gmail.com",
      port: emailConfig.port || 587,
      secure: emailConfig.secure || false,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    logger.info(`[EmailService] Nodemailer SMTP transporter initialized for user: ${emailConfig.auth.user}`);
  } else {
    // Fallback stream transporter for development/testing if no credentials
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    logger.warn("[EmailService] No SMTP credentials detected; using JSON/Console transport.");
  }

  return transporter;
};

export class EmailService {
  /**
   * Core send email method with Nodemailer
   */
  static async sendEmail({ to, subject, html, text }) {
    try {
      const mailer = getTransporter();
      const fromAddress = emailConfig.from || emailConfig.auth?.user || "noreply@secureassess.io";

      logger.info(`[EmailService] Sending email to: ${to} | Subject: "${subject}"`);

      const mailOptions = {
        from: `"SecureAssess Platform" <${fromAddress}>`,
        to,
        subject,
        html: html || `<p>${text || subject}</p>`,
        text: text || subject,
      };

      const info = await mailer.sendMail(mailOptions);
      logger.info(`[EmailService] Email successfully delivered to: ${to}, MessageId: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        to,
        subject,
        timestamp: new Date(),
      };
    } catch (err) {
      logger.error(`[EmailService] Error sending email to ${to}: ${err.message}`);
      return {
        success: false,
        error: err.message,
        to,
        subject,
      };
    }
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

  static async sendInterviewInvitation(to, { candidateName, interviewTitle, interviewDate, interviewTime, interviewType, interviewRoomUrl }) {
    return this.sendTemplatedEmail(to, `Live Interview Invitation: ${interviewTitle || "Technical Defense & Assessment"}`, "interview-scheduled", {
      candidateName: candidateName || "Candidate",
      interviewTitle: interviewTitle || "Live Technical Interview",
      interviewDate: interviewDate || "Scheduled Date",
      interviewTime: interviewTime || "Scheduled Time",
      interviewType: interviewType || "TECHNICAL",
      interviewRoomUrl: interviewRoomUrl || "https://secureassess.io/interview/entry",
    });
  }
}

export default EmailService;
