import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { requireUser } from "../../middlewares/auth";
import { AttemptService } from "./attempt.service";

const startAttempt = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await AttemptService.startAttempt(user.id, req.params["assessmentId"] ?? "");
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: "Attempt started successfully", data });
});

const getAttempt = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await AttemptService.getAttempt(user.id, user.role, req.params["id"] ?? "");
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Attempt retrieved successfully", data });
});

const heartbeat = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await AttemptService.heartbeat(user.id, req.params["id"] ?? "", req.body.event);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Heartbeat recorded", data });
});

const submitAttempt = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await AttemptService.submitAttempt(user.id, req.params["id"] ?? "");
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Attempt submitted successfully", data });
});

const myHistory = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await AttemptService.myHistory(user.id);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Attempt history retrieved successfully", data });
});

export const AttemptController = { startAttempt, getAttempt, heartbeat, submitAttempt, myHistory };
