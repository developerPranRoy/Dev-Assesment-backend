import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AttemptService } from "./attempt.service";

const startAttempt = catchAsync(async (req: Request, res: Response) => {
  const data = await AttemptService.startAttempt(req.user!.id, req.params.assessmentId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Attempt started successfully",
    data,
  });
});

const getAttempt = catchAsync(async (req: Request, res: Response) => {
  const data = await AttemptService.getAttempt(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Attempt retrieved successfully",
    data,
  });
});

const heartbeat = catchAsync(async (req: Request, res: Response) => {
  const data = await AttemptService.heartbeat(req.params.id, req.body.event);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Heartbeat recorded",
    data,
  });
});

const submitAttempt = catchAsync(async (req: Request, res: Response) => {
  const data = await AttemptService.submitAttempt(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Attempt submitted successfully",
    data,
  });
});

const myHistory = catchAsync(async (req: Request, res: Response) => {
  const data = await AttemptService.myHistory(req.user!.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Attempt history retrieved successfully",
    data,
  });
});

export const AttemptController = {
  startAttempt,
  getAttempt,
  heartbeat,
  submitAttempt,
  myHistory,
};
