import app from "./app";
import config from "./config";
import prisma from "./shared/prisma";
import { connectRedis, disconnectRedis } from "./lib/redis";
import logger from "./shared/logger";

const assertJwtSecrets = () => {
  if (!config.jwt.accessSecret || config.jwt.accessSecret.length < 32) {
    throw new Error("JWT_ACCESS_SECRET must be at least 32 characters");
  }
  if (!config.jwt.refreshSecret || config.jwt.refreshSecret.length < 32) {
    throw new Error("JWT_REFRESH_SECRET must be at least 32 characters");
  }
  if (config.jwt.accessSecret === config.jwt.refreshSecret) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different");
  }
};

const bootstrap = async () => {
  assertJwtSecrets();
  await connectRedis();

  const server = app.listen(config.port, () => {
    logger.info({ service: config.serviceName, port: config.port, env: config.env }, "server_started");
  });

  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  const shutdown = (signal: string) => {
    logger.info({ signal }, "shutdown_initiated");
    server.close(async () => {
      await disconnectRedis();
      await prisma.$disconnect();
      logger.info({ signal }, "shutdown_complete");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (err) => {
    logger.error({ err }, "unhandled_rejection");
    server.close(() => process.exit(1));
  });
  process.on("uncaughtException", (err) => {
    logger.error({ err }, "uncaught_exception");
    process.exit(1);
  });
};

bootstrap().catch((err) => {
  logger.error({ err }, "bootstrap_failed");
  process.exit(1);
});
