import rateLimit, { Store, IncrementResponse } from "express-rate-limit";
import config from "../config";
import redis from "../lib/redis";

const { windowMs, max, authMax } = config.rateLimit;

const INCR_EXPIRE_LUA = `
local n = redis.call('INCR', KEYS[1])
if n == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return { n, redis.call('PTTL', KEYS[1]) }
`;

class RedisHitStore implements Store {
  readonly prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(): void {}

  async increment(key: string): Promise<IncrementResponse> {
    const redisKey = `${this.prefix}:${key}`;
    const result = (await redis.eval(INCR_EXPIRE_LUA, 1, redisKey, String(windowMs))) as [number, number];
    return {
      totalHits: Number(result[0]),
      resetTime: new Date(Date.now() + Math.max(Number(result[1]), 0)),
    };
  }

  async decrement(key: string): Promise<void> {
    const redisKey = `${this.prefix}:${key}`;
    const value = await redis.decr(redisKey);
    if (value < 0) await redis.del(redisKey);
  }

  async resetKey(key: string): Promise<void> {
    await redis.del(`${this.prefix}:${key}`);
  }
}

export const apiLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisHitStore("rl:api"),
  message: { success: false, message: "Too many requests, please try again later", errors: [] },
  skip: (req) => req.method === "OPTIONS",
});

export const authLimiter = rateLimit({
  windowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisHitStore("rl:auth"),
  message: { success: false, message: "Too many authentication attempts, please try again later", errors: [] },
  skip: (req) => req.method === "OPTIONS",
});
