import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  serviceName: (process.env.SERVICE_NAME || "all") as "all" | "auth" | "core" | "exam" | "payment",
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
    max: Number(process.env.RATE_LIMIT_MAX) || 1000,
    authMax: Number(process.env.RATE_LIMIT_AUTH_MAX) || 20,
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/v1/auth/google/callback",
  },

  judge0: {
    apiUrl: process.env.JUDGE0_API_URL,
    concurrency: Number(process.env.JUDGE0_CONCURRENCY) || 4,
    timeoutMs: Number(process.env.JUDGE0_TIMEOUT_MS) || 15_000,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY as string,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET as string,
    successUrl: process.env.STRIPE_SUCCESS_URL || "https://example.com/payment/success",
    cancelUrl: process.env.STRIPE_CANCEL_URL || "https://example.com/payment/cancel",
  },

  redis: {
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    apiSecret: process.env.CLOUDINARY_API_SECRET as string,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "*",
  },

  frontendUrl: process.env.FRONTEND_URL || "",

  cookie: {
    secure: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
  },

  credits: {
    perInvitation: Number(process.env.CREDITS_PER_INVITATION) || 1,
  },

  email: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "noreply@devassessment.io",
  },

  log: {
    level: process.env.LOG_LEVEL || "info",
  },
} as const;
