import { PrismaClient } from "@prisma/client";

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

const createClient = () =>
  new PrismaClient({
    log: isDev
      ? [
          { emit: "event", level: "query" },
          { emit: "stdout", level: "error" },
          { emit: "stdout", level: "warn" },
        ]
      : [{ emit: "stdout", level: "error" }],
    errorFormat: isDev ? "pretty" : "minimal",
  });

declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma: PrismaClient =
  isDev || isTest
    ? (global.__prisma ?? (global.__prisma = createClient()))
    : createClient();

export default prisma;
