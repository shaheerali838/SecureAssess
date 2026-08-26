import { ENV } from "./env.js";

const getTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message, ...args) => {
    console.log(`[INFO] [${getTimestamp()}] ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[WARN] [${getTimestamp()}] ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`[ERROR] [${getTimestamp()}] ${message}`, ...args);
  },
  debug: (message, ...args) => {
    if (ENV.NODE_ENV !== "production") {
      console.debug(`[DEBUG] [${getTimestamp()}] ${message}`, ...args);
    }
  },
};
