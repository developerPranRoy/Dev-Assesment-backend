import redis from "./redis";
import logger from "../shared/logger";

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.warn({ err, key }, "cache_get_error");
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown, ttlSeconds: number): Promise<void> => {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, "cache_set_error");
  }
};

export const cacheDel = async (...keys: string[]): Promise<void> => {
  if (!keys.length) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    logger.warn({ err, keys }, "cache_del_error");
  }
};

export const cacheGetOrSet = async <T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> => {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await loader();
  if (value !== undefined && value !== null) {
    cacheSet(key, value, ttlSeconds).catch(() => undefined);
  }
  return value;
};

export const CacheKeys = {
  membership: (userId: string) => `cache:membership:${userId}`,
  member: (companyId: string, userId: string) => `cache:member:${companyId}:${userId}`,
  adminStats: "cache:admin:stats",
  assessment: (id: string) => `cache:assessment:${id}`,
};

export const CACHE_TTL = {
  membership: 120,
  member: 120,
  adminStats: 30,
  assessment: 300,
};
