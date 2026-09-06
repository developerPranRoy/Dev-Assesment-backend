import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status";
import { Role } from "@prisma/client";
import ApiError from "../shared/ApiError";
import config from "../config";
import { isTokenBlacklisted } from "../lib/tokenBlacklist";

export interface AuthUser extends JwtPayload {
  id: string;
  role: Role;
  jti?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
  return req.user;
};

const auth = (...allowedRoles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
      }

      const token = authHeader.split(" ")[1] ?? "";

      let decoded: AuthUser;
      try {
        decoded = jwt.verify(token, config.jwt.accessSecret) as unknown as AuthUser;
      } catch {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired token");
      }

      if (await isTokenBlacklisted(decoded.jti)) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Token has been revoked");
      }

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to perform this action");
      }

      req.user = decoded;
      next();
    } catch (err) {
      next(err);
    }
  };

export default auth;
