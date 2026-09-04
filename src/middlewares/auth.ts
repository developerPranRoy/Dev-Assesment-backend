import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status";
import { Role } from "@prisma/client";
import ApiError from "../shared/ApiError";
import config from "../config";

export interface AuthUser extends JwtPayload {
  id: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Verifies the Bearer access token and optionally restricts the route to
 * specific roles. Call as `auth()` for "any authenticated user" or
 * `auth("ADMIN")` / `auth("COMPANY", "ADMIN")` to restrict by role.
 */
const auth = (...allowedRoles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
      }

      const token = authHeader.split(" ")[1];

      let decoded: AuthUser;
      try {
        decoded = jwt.verify(token, config.jwt.accessSecret) as AuthUser;
      } catch {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired token");
      }

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "You do not have permission to perform this action"
        );
      }

      req.user = decoded;
      next();
    } catch (err) {
      next(err);
    }
  };

export default auth;
