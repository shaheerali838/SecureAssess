import { ENV } from "./env.js";

export const emailConfig = {
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_PORT === 465,
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS,
  },
  from: ENV.EMAIL_FROM,
};
