import rateLimit from "express-rate-limit";
import config from "../config";

const { windowMs, max, authMax } = config.rateLimit;

/** General API rate limit — applied globally */
export const apiLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
    errors: [],
  },
});

/** Stricter limit for auth endpoints (login/register) */
export const authLimiter = rateLimit({
  windowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
    errors: [],
  },
});
