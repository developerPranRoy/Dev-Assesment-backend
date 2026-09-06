import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import router from "./routes";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import notFound from "./middlewares/notFound";
import { apiLimiter } from "./middlewares/rateLimiter";
import requestId from "./middlewares/requestId";
import config from "./config";
import prisma from "./shared/prisma";
import redis from "./lib/redis";
import logger from "./shared/logger";

const app: Application = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(requestId);

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level]({ method: req.method, url: req.originalUrl, status: res.statusCode, ms, ip: req.ip }, "http_request");
  });
  next();
});

app.use(compression());
app.use(
  cors({
    origin: config.cors.origin === "*" ? true : config.cors.origin.split(",").map((o) => o.trim()),
    credentials: true,
  })
);
app.use(cookieParser());

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === "/api/v1/payments/webhook") return next();
  express.json({ limit: "1mb" })(req, res, next);
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === "/api/v1/payments/webhook") return next();
  express.urlencoded({ extended: true, limit: "1mb" })(req, res, next);
});

app.use(apiLimiter);

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Server is running", data: { service: config.serviceName } });
});

app.get("/ready", async (_req, res) => {
  try {
    await Promise.all([prisma.$queryRawUnsafe("SELECT 1"), redis.ping()]);
    res.status(200).json({ success: true, message: "Ready", data: { service: config.serviceName } });
  } catch {
    res.status(503).json({ success: false, message: "Not ready", data: { service: config.serviceName } });
  }
});

app.use("/api/v1", router);
app.use(notFound);
app.use(globalErrorHandler);

export default app;
