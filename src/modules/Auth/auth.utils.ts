import jwt from "jsonwebtoken";
import crypto from "crypto";
import { CookieOptions, Response } from "express";
import { Role } from "@prisma/client";
import config from "../../config";

export type TokenPayload = {
  id: string;
  role: Role;
  jti: string;
};

const REFRESH_COOKIE = "refreshToken";

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: "lax",
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

const generateAccessToken = (payload: Omit<TokenPayload, "jti"> & { jti?: string }) =>
  jwt.sign(
    { id: payload.id, role: payload.role, jti: payload.jti || crypto.randomUUID() },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"] }
  );

const generateRefreshToken = (payload: Omit<TokenPayload, "jti"> & { jti?: string }) =>
  jwt.sign(
    { id: payload.id, role: payload.role, jti: payload.jti || crypto.randomUUID() },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"] }
  );

const issueTokenPair = (user: { id: string; role: Role }) => {
  const accessJti = crypto.randomUUID();
  const refreshJti = crypto.randomUUID();
  return {
    accessToken: generateAccessToken({ id: user.id, role: user.role, jti: accessJti }),
    refreshToken: generateRefreshToken({ id: user.id, role: user.role, jti: refreshJti }),
  };
};

const verifyRefreshToken = (token: string) =>
  jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;

const ttlSecondsFromToken = (token: string) => {
  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  if (!decoded?.exp) return 60 * 60;
  return Math.max(decoded.exp - Math.floor(Date.now() / 1000), 1);
};

const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions());
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE, { ...cookieOptions(), maxAge: 0 });
};

export const TokenUtils = {
  REFRESH_COOKIE,
  generateAccessToken,
  generateRefreshToken,
  issueTokenPair,
  verifyRefreshToken,
  ttlSecondsFromToken,
  setRefreshCookie,
  clearRefreshCookie,
};
