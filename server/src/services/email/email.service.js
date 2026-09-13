import fs from "fs";
import path from "path";
import dns from "node:dns";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { emailConfig } from "../../config/email.js";
import { logger } from "../../config/logger.js";
import { ENV } from "../../config/env.js";

// Ensure Node defaults to IPv4 first to prevent ENETUNREACH on dual-stack networks
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let transporter = null;

const isTestOrMockAddress = (to) => {
  if (!to || typeof to !== "string") return true;
  const lower = to.toLowerCase().trim();
  
  // Only skip explicitly simulated test domains (never skip real domains like gmail, outlook, etc.)
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

const resolveIpv4Host = async (rawHost) => {
  try {
    const addresses = await dns.promises.resolve4(rawHost);
    if (addresses && addresses.length > 0) {
      return addresses[0];
    }
  } catch (err) {
    logger.debug(`[EmailService] IPv4 DNS lookup fallback for ${rawHost}: ${err.message}`);
  }
  return rawHost;
};

const createSmtpTransporter = async (port = 465, secure = true) => {
  const user = (emailConfig.auth?.user || "").trim();
  const pass = (emailConfig.auth?.pass || "").toString().replace(/\s+/g, "");
  const baseHost = emailConfig.host || "smtp.gmail.com";
  const isGmail =
    baseHost.includes("gmail") ||
    (user && user.toLowerCase().endsWith("@gmail.com"));
  const hostname = isGmail ? "smtp.gmail.com" : baseHost;

  const targetIp = await resolveIpv4Host(hostname);

  return nodemailer.createTransport({
    host: targetIp,
    port,
    secure,
    auth: { user, pass },
    tls: {
      servername: hostname,
      rejectUnauthorized: false,
    },
    connectionTimeout: 6000,
    greetingTimeout: 6000,
    socketTimeout: 8000,
  });
};

const getTransporter = async () => {
  if (transporter) return transporter;

  const isTestEnv = ENV.NODE_ENV === "test" || process.env.DISABLE_EMAIL_DISPATCH === "true";
  const user = (emailConfig.auth?.user || "").trim();
  const pass = (emailConfig.auth?.pass || "").toString().replace(/\s+/g, "");
  const hasAuth = Boolean(user && pass);

  if (hasAuth && !isTestEnv) {
    transporter = await createSmtpTransporter(465, true);
    logger.info(`[EmailService] Nodemailer SMTP SSL direct IPv4 initialized for: ${user}`);
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    logger.warn(`[EmailService] Using JSON/Mock transport (testEnv: ${isTestEnv}, hasAuth: ${hasAuth}).`);
  }

  return transporter;
};

export class EmailService {
  /**
   * Core send email method with Nodemailer
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

      const mailer = await getTransporter();
      const fromAddress = emailConfig.from || emailConfig.auth?.user || "noreply@secureassess.io";

      logger.info(`[EmailService] Sending live email to: ${to} | Subject: "${subject}"`);

      const mailOptions = {
        from: `"SecureAssess Platform" <${fromAddress}>`,
        to,
        subject,
        html: html || `<p>${text || subject}</p>`,
        text: text || subject,
      };

      let info;
      try {
        info = await mailer.sendMail(mailOptions);
      } catch (firstErr) {
        logger.warn(`[EmailService] Initial dispatch encountered: ${firstErr.message}. Retrying over Port 587 IPv4...`);
        try {
          const fallbackMailer = await createSmtpTransporter(587, false);
          info = await fallbackMailer.sendMail(mailOptions);
        } catch (secondErr) {
          logger.warn(`[EmailService] SMTP direct egress blocked on hosting network (${secondErr.message}). Entry link is preserved and accessible via UI.`);
          return {
            success: false,
            error: secondErr.message,
            to,
            subject,
            notice: "Outbound SMTP port blocked by hosting firewall. Access link via Dashboard.",
          };
        }
      }

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
