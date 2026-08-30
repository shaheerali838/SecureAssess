import { ENV } from "./env.js";

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

const formatTime = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
};

export const logger = {
  info: (message, ...args) => {
    console.log(
      `${COLORS.gray}${formatTime()}${COLORS.reset} ${COLORS.green}${COLORS.bold}✔ INFO${COLORS.reset}  ${message}`,
      ...args,
    );
  },
  warn: (message, ...args) => {
    console.warn(
      `${COLORS.gray}${formatTime()}${COLORS.reset} ${COLORS.yellow}${COLORS.bold}▲ WARN${COLORS.reset}  ${message}`,
      ...args,
    );
  },
  error: (message, ...args) => {
    console.error(
      `${COLORS.gray}${formatTime()}${COLORS.reset} ${COLORS.red}${COLORS.bold}✖ FAIL${COLORS.reset}  ${message}`,
      ...args,
    );
  },
  debug: (message, ...args) => {
    if (ENV.NODE_ENV !== "production") {
      console.debug(
        `${COLORS.gray}${formatTime()}${COLORS.reset} ${COLORS.cyan}${COLORS.bold}◆ DBG${COLORS.reset}   ${message}`,
        ...args,
      );
    }
  },
};
