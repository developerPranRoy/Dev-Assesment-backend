import crypto from "crypto";
import httpStatus from "http-status";
import redis from "./redis";
import ApiError from "../shared/ApiError";

const RELEASE_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
else
  return 0
end
`;

type UnlockFn = () => Promise<void>;

export const acquireLock = async (
  key: string,
  ttlMs = 10_000,
  { retries = 5, retryDelayMs = 150 }: { retries?: number; retryDelayMs?: number } = {}
): Promise<UnlockFn> => {
  const token = crypto.randomUUID();
  const lockKey = `lock:${key}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const acquired = await redis.set(lockKey, token, "PX", ttlMs, "NX");
    if (acquired === "OK") {
      return async () => {
        await redis.eval(RELEASE_SCRIPT, 1, lockKey, token);
      };
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }

  throw new ApiError(httpStatus.CONFLICT, "Resource is temporarily locked — please retry");
};
