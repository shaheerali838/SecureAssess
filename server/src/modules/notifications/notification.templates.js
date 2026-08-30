import {
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
} from "./notification.constants.js";

export const NOTIFICATION_TEMPLATES = Object.freeze({
  [NOTIFICATION_TYPES.ACCOUNT_CREATED]: {
    title: "Welcome to SecureAssess",
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    formatMessage: (data = {}) =>
      `Welcome to SecureAssess, ${data.name || "User"}! Your account is active.`,
  },
  [NOTIFICATION_TYPES.EMAIL_VERIFICATION]: {
    title: "Verify Your Email Address",
    channels: [NOTIFICATION_CHANNELS.EMAIL],
    formatMessage: (data = {}) =>
      `Your verification code is: ${data.code || ""}. It expires in 15 minutes.`,
  },
  [NOTIFICATION_TYPES.PASSWORD_RESET]: {
    title: "Password Reset Request",
    channels: [NOTIFICATION_CHANNELS.EMAIL],
    formatMessage: (data = {}) =>
      `You requested a password reset. Use link: ${data.resetUrl || ""}`,
  },
  [NOTIFICATION_TYPES.ASSESSMENT_ASSIGNED]: {
    title: "New Assessment Assigned",
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    formatMessage: (data = {}) =>
      `You have been assigned to assessment: '${data.assessmentTitle || "Assessment"}'. Access Code: ${data.accessCode || "N/A"}.`,
  },
  [NOTIFICATION_TYPES.ASSESSMENT_UPDATED]: {
    title: "Assessment Schedule Updated",
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    formatMessage: (data = {}) =>
      `The schedule for '${data.assessmentTitle || "Assessment"}' has been updated.`,
  },
  [NOTIFICATION_TYPES.ASSESSMENT_EXPIRING]: {
    title: "Assessment Expiring Soon",
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    formatMessage: (data = {}) =>
      `Reminder: Your assignment for '${data.assessmentTitle || "Assessment"}' will expire on ${data.expiresAt || "soon"}.`,
  },
  [NOTIFICATION_TYPES.ATTEMPT_STARTED]: {
    title: "Assessment Attempt Started",
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    formatMessage: (data = {}) =>
      `Your attempt for '${data.assessmentTitle || "Assessment"}' is now in progress.`,
  },
  [NOTIFICATION_TYPES.ATTEMPT_SUBMITTED]: {
    title: "Assessment Attempt Submitted",
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    formatMessage: (data = {}) =>
      `Your attempt for '${data.assessmentTitle || "Assessment"}' was submitted successfully.`,
  },
  [NOTIFICATION_TYPES.RESULT_PUBLISHED]: {
    title: "Assessment Result Published",
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    formatMessage: (data = {}) =>
      `The official results for '${data.assessmentTitle || "Assessment"}' are now available.`,
  },
  [NOTIFICATION_TYPES.PROCTORING_WARNING]: {
    title: "Proctoring Warning",
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    formatMessage: (data = {}) =>
      `Integrity warning: ${data.warningMessage || "Suspicious behavior detected during examination."}`,
  },
  [NOTIFICATION_TYPES.PROCTORING_REVIEW_REQUIRED]: {
    title: "Proctoring Review Required",
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    formatMessage: (data = {}) =>
      `Candidate attempt '${data.attemptId || ""}' for '${data.assessmentTitle || "Assessment"}' was flagged for review (Risk: ${data.riskLevel || "HIGH"}).`,
  },
  [NOTIFICATION_TYPES.INTERVIEW_SCHEDULED]: {
    title: "Technical Interview Scheduled",
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    formatMessage: (data = {}) =>
      `Your interview for '${data.title || "Evaluation"}' is scheduled for ${data.scheduledTime || "upcoming"}.`,
  },
  [NOTIFICATION_TYPES.CERTIFICATE_ISSUED]: {
    title: "Certificate Issued",
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    formatMessage: (data = {}) =>
      `Congratulations! Your verified certificate for '${data.assessmentTitle || "Assessment"}' has been issued.`,
  },
  [NOTIFICATION_TYPES.SECURITY_ALERT]: {
    title: "Security Alert",
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    formatMessage: (data = {}) =>
      `Security Alert: ${data.message || "A new login or security event was detected on your account."}`,
  },
});
