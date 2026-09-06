import { AsyncLocalStorage } from "async_hooks";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

const LEVEL_NUMS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: number = LEVEL_NUMS[(process.env.LOG_LEVEL as LogLevel | undefined) ?? "info"] ?? 20;

export const correlationStore = new AsyncLocalStorage<{ requestId: string }>();

const serialiseError = (err: unknown): Record<string, unknown> => {
  if (err instanceof Error) {
    return {
      message: err.message,
      name: err.name,
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    };
  }
  return { message: String(err) };
};

const write = (level: LogLevel, ctx: LogContext, msg: string): void => {
  if (LEVEL_NUMS[level] < MIN_LEVEL) return;

  const store = correlationStore.getStore();
  const entry: Record<string, unknown> = {
    level,
    time: new Date().toISOString(),
    msg,
    ...(store?.requestId ? { requestId: store.requestId } : {}),
    service: process.env.SERVICE_NAME ?? "all",
  };

  for (const [k, v] of Object.entries(ctx)) {
    entry[k] = v instanceof Error ? serialiseError(v) : v;
  }

  const line = JSON.stringify(entry);
  if (level === "error" || level === "warn") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
};

const logger = {
  debug: (ctx: LogContext, msg: string) => write("debug", ctx, msg),
  info: (ctx: LogContext, msg: string) => write("info", ctx, msg),
  warn: (ctx: LogContext, msg: string) => write("warn", ctx, msg),
  error: (ctx: LogContext, msg: string) => write("error", ctx, msg),
};

export default logger;
