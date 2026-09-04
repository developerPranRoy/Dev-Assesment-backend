import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import config from "../../config";

export type TokenPayload = {
  id: string;
  role: Role;
};

const generateAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"],
  });

const generateRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"],
  });

const verifyRefreshToken = (token: string) =>
  jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;

export const TokenUtils = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};
