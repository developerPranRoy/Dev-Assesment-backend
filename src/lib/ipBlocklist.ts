import redis from "./redis";
import logger from "../shared/logger";

const BLOCK_KEY = (ip: string) => `ip:block:${ip}`;
const STRIKE_KEY = (ip: string) => `ip:strikes:${ip}`;

const STRIKE_WINDOW_SECONDS = 60 * 10;
const MAX_STRIKES = 10;
const AUTO_BLOCK_TTL_SECONDS = 60 * 60 * 24;

export const isIpBlocked = async (ip: string): Promise<boolean> => {
  try {
    const blocked = await redis.exists(BLOCK_KEY(ip));
    return blocked === 1;
  } catch {
    return false;
  }
};

export const blockIp = async (ip: string, ttlSeconds?: number): Promise<void> => {
  try {
    if (ttlSeconds) {
      await redis.set(BLOCK_KEY(ip), "1", "EX", ttlSeconds);
    } else {
      await redis.set(BLOCK_KEY(ip), "1");
    }
    logger.warn({ ip, ttlSeconds: ttlSeconds ?? "permanent" }, "ip_blocked");
  } catch (err) {
    logger.error({ err, ip }, "ip_block_failed");
  }
};

export const unblockIp = async (ip: string): Promise<void> => {
  try {
    await redis.del(BLOCK_KEY(ip));
    await redis.del(STRIKE_KEY(ip));
    logger.info({ ip }, "ip_unblocked");
  } catch (err) {
    logger.error({ err, ip }, "ip_unblock_failed");
  }
};

export const recordStrike = async (ip: string): Promise<void> => {
  try {
    const strikes = await redis.incr(STRIKE_KEY(ip));
    if (strikes === 1) {
      await redis.expire(STRIKE_KEY(ip), STRIKE_WINDOW_SECONDS);
    }
    if (strikes >= MAX_STRIKES) {
      await blockIp(ip, AUTO_BLOCK_TTL_SECONDS);
      logger.warn({ ip, strikes }, "ip_auto_blocked_after_strikes");
    }
  } catch (err) {
    logger.error({ err, ip }, "ip_strike_failed");
  }
};

export const listBlockedIps = async (): Promise<{ ip: string; ttl: number }[]> => {
  try {
    const keys = await redis.keys("ip:block:*");
    if (!keys.length) return [];

    const results = await Promise.all(
      keys.map(async (key) => {
        const ttl = await redis.ttl(key);
        const ip = key.replace("ip:block:", "");
        return { ip, ttl };
      })
    );

    return results.sort((a, b) => a.ip.localeCompare(b.ip));
  } catch (err) {
    logger.error({ err }, "ip_list_blocked_failed");
    return [];
  }
};
