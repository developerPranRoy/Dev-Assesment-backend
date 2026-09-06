import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { requireUser } from "../../middlewares/auth";
import { SubmissionService } from "./submission.service";

const submitAnswer = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await SubmissionService.submitAnswer(user.id, req.params["attemptId"] ?? "", req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: "Answer submitted successfully", data });
});

const evaluateSubmission = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await SubmissionService.evaluateSubmission(user.id, req.params["id"] ?? "", req.body.manualScore);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Submission evaluated successfully", data });
});

const getScore = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await SubmissionService.getScore(user.id, user.role, req.params["attemptId"] ?? "");
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Score retrieved successfully", data });
});

export const SubmissionController = { submitAnswer, evaluateSubmission, getScore };
