import { ENV } from "./env.js";

export const redisConfig = {
  url: ENV.REDIS_URL,
  retryStrategy: (times) => Math.min(times * 50, 2000),
};
