import { emailConfig } from "../../config/email.js";
import { logger } from "../../config/logger.js";

export class EmailService {
  static async sendEmail({ to, subject, html, text }) {
    logger.info(`[EmailService] Sending email to: ${to}, Subject: ${subject}`);
    // Transport stub / nodemailer integration
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      to,
      subject,
    };
  }

  static async sendVerificationEmail(to, code) {
    return this.sendEmail({
      to,
      subject: "Verify your SecureAssess account",
      html: `<p>Your verification code is: <strong>${code}</strong>. Valid for 15 minutes.</p>`,
      text: `Your verification code is: ${code}`,
    });
  }

  static async sendAssessmentInvitation(to, assessmentName, accessLink) {
    return this.sendEmail({
      to,
      subject: `Assessment Invitation: ${assessmentName}`,
      html: `<p>You have been invited to take <strong>${assessmentName}</strong>.</p><p><a href="${accessLink}">Click here to start assessment</a></p>`,
      text: `You have been invited to take ${assessmentName}. Start here: ${accessLink}`,
    });
  }
}
