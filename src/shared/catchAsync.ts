import { NextFunction, Request, Response, RequestHandler } from "express";

/**
 * Wraps an async route handler so unhandled promise rejections are forwarded
 * to Express's error pipeline via next(). Fully typed — no more `fn: Function`.
 */
const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
