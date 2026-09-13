import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { emailConfig } from "../../config/email.js";
import { logger } from "../../config/logger.js";
import { ENV } from "../../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let transporter = null;

const isTestOrMockAddress = (to) => {
  if (!to || typeof to !== "string") return true;
  const lower = to.toLowerCase().trim();
  const testPatterns = [
    /@example\.com$/,
    /@test\.com$/,
    /@mock\.com$/,
    /@invalid\.com$/,
    /@mock\.local$/,
    /@test\.local$/,
  ];
  return testPatterns.some((pattern) => pattern.test(lower));
};

const getSmtpTransporter = () => {
  if (transporter) return transporter;

  const isTestEnv = ENV.NODE_ENV === "test" || process.env.DISABLE_EMAIL_DISPATCH === "true";
  const user = (emailConfig.auth?.user || "").trim();
  const pass = (emailConfig.auth?.pass || "").toString().replace(/\s+/g, "");
  const host = (emailConfig.host || "smtp.gmail.com").trim();
  const isGmail = host.includes("gmail") || user.toLowerCase().endsWith("@gmail.com");
  const hasAuth = Boolean(user && pass);

  if (hasAuth && !isTestEnv) {
    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });
      logger.info(`[EmailService] Nodemailer Gmail SMTP initialized for: ${user}`);
    } else {
      transporter = nodemailer.createTransport({
        host,
        port: emailConfig.port || 587,
        secure: emailConfig.port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });
      logger.info(`[EmailService] Nodemailer SMTP relay initialized for host: ${host}, user: ${user}`);
    }
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    logger.warn(`[EmailService] Using JSON/Mock transport (testEnv: ${isTestEnv}, hasAuth: ${hasAuth}).`);
  }

  return transporter;
};

const sendViaBrevoApi = async ({ to, subject, html, text, fromAddress }) => {
  const apiKey = (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || "").trim();
  if (!apiKey) return null;

  const senderEmail = (emailConfig.auth?.user || fromAddress || "shaheer838838@gmail.com").trim();

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "SecureAssess Platform",
        email: senderEmail,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html || `<p>${text || subject}</p>`,
      textContent: text || subject,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.code || `Brevo HTTP error ${res.status}`);
  }

  return { messageId: data.messageId || `brevo-${Date.now()}` };
};

const sendViaResendApi = async ({ to, subject, html, text, fromAddress }) => {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) return null;

  const from =
    fromAddress.includes("@") && !fromAddress.includes("gmail.com") && !fromAddress.includes("localhost")
      ? fromAddress
      : "SecureAssess <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: html || `<p>${text || subject}</p>`,
      text: text || subject,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || JSON.stringify(data));
  }

  return { messageId: data.id };
};

const sendViaMailjetApi = async ({ to, subject, html, text, fromAddress }) => {
  const apiKey = (process.env.MJ_APIKEY_PUBLIC || process.env.MAILJET_API_KEY || "").trim();
  const secretKey = (process.env.MJ_APIKEY_PRIVATE || process.env.MAILJET_SECRET_KEY || "").trim();

  if (!apiKey || !secretKey) return null;

  const authHeader = "Basic " + Buffer.from(`${apiKey}:${secretKey}`).toString("base64");
  const senderEmail = fromAddress.includes("@") ? fromAddress : "Saylanibootcamp.lms@gmail.com";

  const res = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Messages: [
        {
          From: {
            Email: senderEmail,
            Name: "SecureAssess Platform",
          },
          To: [
            {
              Email: to,
              Name: to.split("@")[0] || "Candidate",
            },
          ],
          Subject: subject,
          TextPart: text || subject,
          HTMLPart: html || `<p>${text || subject}</p>`,
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.ErrorMessage || JSON.stringify(data));
  }

  const messageId = data.Messages?.[0]?.To?.[0]?.MessageID || `mj-${Date.now()}`;
  return { messageId };
};

export class EmailService {
  /**
   * Core send live email method via Brevo, Resend, Mailjet, or SMTP Relay
   */
  static async sendEmail({ to, subject, html, text }) {
    try {
      if (!to) {
        logger.warn("[EmailService] sendEmail called without recipient 'to' address.");
        return { success: false, error: "Missing recipient address" };
      }

      // Safeguard: Check if email is test/mock address or in test environment
      if (ENV.NODE_ENV === "test" || isTestOrMockAddress(to)) {
        logger.info(`[EmailService] [SIMULATED] Skipping live SMTP dispatch for test/mock recipient: ${to} | Subject: "${subject}"`);
        return {
          success: true,
          simulated: true,
          messageId: `mock-msg-${Date.now()}@secureassess.local`,
          to,
          subject,
          timestamp: new Date(),
        };
      }

      const fromAddress = emailConfig.from || emailConfig.auth?.user || "noreply@secureassess.io";

      // 1. Check for Brevo HTTPS REST API (Port 443)
      try {
        const brevoResult = await sendViaBrevoApi({ to, subject, html, text, fromAddress });
        if (brevoResult) {
          logger.info(`[EmailService] Delivered via Brevo HTTPS API to: ${to}, MessageId: ${brevoResult.messageId}`);
          return {
            success: true,
            messageId: brevoResult.messageId,
            to,
            subject,
            timestamp: new Date(),
          };
        }
      } catch (brevoErr) {
        logger.warn(`[EmailService] Brevo HTTPS API: ${brevoErr.message}. Falling back...`);
      }

      // 2. Check for Resend HTTPS REST API (Port 443)
      try {
        const resendResult = await sendViaResendApi({ to, subject, html, text, fromAddress });
        if (resendResult) {
          logger.info(`[EmailService] Delivered via Resend HTTPS API to: ${to}, MessageId: ${resendResult.messageId}`);
          return {
            success: true,
            messageId: resendResult.messageId,
            to,
            subject,
            timestamp: new Date(),
          };
        }
      } catch (resendErr) {
        logger.warn(`[EmailService] Resend HTTPS API: ${resendErr.message}. Falling back...`);
      }

      // 3. Check for Mailjet HTTPS REST API (Port 443)
      try {
        const mjResult = await sendViaMailjetApi({ to, subject, html, text, fromAddress });
        if (mjResult) {
          logger.info(`[EmailService] Delivered via Mailjet HTTPS API to: ${to}, MessageId: ${mjResult.messageId}`);
          return {
            success: true,
            messageId: mjResult.messageId,
            to,
            subject,
            timestamp: new Date(),
          };
        }
      } catch (mjErr) {
        logger.warn(`[EmailService] Mailjet HTTPS API: ${mjErr.message}. Falling back...`);
      }

      // 4. Fallback to Direct SMTP Relay
      const mailer = getSmtpTransporter();
      logger.info(`[EmailService] Sending live email via SMTP to: ${to} | Subject: "${subject}"`);

      const mailOptions = {
        from: `"SecureAssess Platform" <${fromAddress}>`,
        to,
        subject,
        html: html || `<p>${text || subject}</p>`,
        text: text || subject,
      };

      const info = await mailer.sendMail(mailOptions);
      logger.info(`[EmailService] Email successfully delivered via Gmail to: ${to}, MessageId: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        to,
        subject,
        timestamp: new Date(),
      };
    } catch (err) {
      logger.error(`[EmailService] Error sending email via Gmail to ${to}: ${err.message}`);
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

  static async sendPasswordResetEmail(to, { name, resetUrl }) {
    return this.sendTemplatedEmail(to, "Reset Your SecureAssess Password", "password-reset", {
      name: name || "User",
      resetUrl,
    });
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
      interviewRoomUrl: interviewRoomUrl || `${ENV.CLIENT_URL || "https://secure-assess.vercel.app"}/interview/entry`,
    });
  }

  /**
   * Sends tenant provisioning email to owner / tenant admin
   */
  static async sendTenantProvisionedEmail(to, {
    ownerName,
    organizationName,
    organizationCode,
    organizationSlug,
    roleName = "Organization Owner",
    industry = "Higher Education & Academic",
    tierName = "Starter Academic Tier",
    loginEmail,
    temporaryPassword,
    actionUrl,
    actionText = "Sign In & Access Workspace",
  }) {
    return this.sendTemplatedEmail(
      to,
      `Welcome to SecureAssess — ${organizationName} Workspace Provisioned`,
      "tenant-provisioned",
      {
        ownerName: ownerName || "Workspace Administrator",
        organizationName,
        organizationCode: organizationCode || "N/A",
        organizationSlug: organizationSlug || "workspace",
        roleName,
        industry,
        tierName,
        loginEmail: loginEmail || to,
        actionUrl: actionUrl || `${ENV.CLIENT_URL || "https://secure-assess.vercel.app"}/login`,
        actionText,
        currentYear: new Date().getFullYear(),
      }
    );
  }

  /**
   * Sends staff invitation email to join an organization
   */
  static async sendOrganizationInvitationEmail(to, {
    recipientName,
    organizationName,
    roleName,
    inviterName = null,
    loginEmail,
    temporaryPassword,
    invitationUrl,
    expiresIn = "7 days",
  }) {
    const inviterText = inviterName ? ` by ${inviterName}` : "";
    return this.sendTemplatedEmail(
      to,
      `Invitation: Join ${organizationName} on SecureAssess as ${roleName}`,
      "organization-invitation",
      {
        recipientName: recipientName || "Colleague",
        organizationName,
        roleName: roleName || "Staff Member",
        inviterText,
        loginEmail: loginEmail || to,
        invitationUrl: invitationUrl || `${ENV.CLIENT_URL || "https://secure-assess.vercel.app"}/login`,
        expiresIn,
        currentYear: new Date().getFullYear(),
      }
    );
  }
}

export default EmailService;
