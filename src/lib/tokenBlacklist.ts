import jwt from "jsonwebtoken";
import redis from "../lib/redis";
import { TokenUtils } from "../modules/Auth/auth.utils";

const keyFor = (jti: string) => `token:bl:${jti}`;

export const blacklistToken = async (token: string) => {
  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  if (!decoded?.jti) return;
  const ttl = TokenUtils.ttlSecondsFromToken(token);
  await redis.set(keyFor(decoded.jti), "1", "EX", ttl);
};

export const isTokenBlacklisted = async (jti?: string) => {
  if (!jti) return false;
  const hit = await redis.get(keyFor(jti));
  return Boolean(hit);
};
