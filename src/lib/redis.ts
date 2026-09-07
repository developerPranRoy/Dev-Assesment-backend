import { Redis } from "ioredis";
import config from "../config";
import logger from "../shared/logger";

const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 200, 2_000),
  connectTimeout: 5_000,
  commandTimeout: 5_000,
  keepAlive: 10_000,
});

redis.on("error", (err: Error) => logger.error({ err }, "redis_error"));
redis.on("reconnecting", () => logger.warn({}, "redis_reconnecting"));
redis.on("ready", () => logger.info({}, "redis_ready"));

export const connectRedis = async (): Promise<void> => {
  try {
    if (redis.status === "wait") await redis.connect();
    await redis.ping();
  } catch (err) {
    logger.error({ err, url: config.redis.url }, "redis_connect_failed");
    logger.warn({}, "server_starting_without_redis — rate limiting and cache disabled");
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redis.status !== "end") await redis.quit();
  } catch {
    // ignore disconnect errors
  }
};

export default redis;
