import { Response } from "express";

type ResponsePayload<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  meta?: { page: number; limit: number; total: number; totalPages: number };
  data?: T | null;
};

const sendResponse = <T>(res: Response, payload: ResponsePayload<T>) => {
  res.status(payload.statusCode).json({
    success: payload.success,
    message: payload.message,
    ...(payload.meta && { meta: payload.meta }),
    data: payload.data ?? null,
  });
};

export default sendResponse;
