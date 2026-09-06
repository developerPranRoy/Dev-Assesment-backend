import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { correlationStore } from "../shared/logger";

const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const id =
    (req.headers["x-request-id"] as string | undefined) ||
    (req.headers["x-correlation-id"] as string | undefined) ||
    crypto.randomUUID();
  res.setHeader("X-Request-Id", id);
  correlationStore.run({ requestId: id }, next);
};

export default requestId;
