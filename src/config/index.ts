import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET as string,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  bcrypt: {
    saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  },

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    authMax: Number(process.env.RATE_LIMIT_AUTH_MAX) || 10,
  },

  // Not used yet — googleAuth is stubbed until real credentials are supplied.
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },

  // Self-hosted or public Judge0 instance for grading CODING submissions.
  // Coding submissions stay ungraded (PENDING) until this is set.
  judge0: {
    apiUrl: process.env.JUDGE0_API_URL,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "*",
  },
};
