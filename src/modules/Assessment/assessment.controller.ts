import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { requireUser } from "../../middlewares/auth";
import { AssessmentService } from "./assessment.service";

const createAssessment = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await AssessmentService.createAssessment(user.id, req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: "Assessment created successfully", data });
});

const listAssessments = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { assessments, meta } = await AssessmentService.listAssessments(user.id, req.query as Parameters<typeof AssessmentService.listAssessments>[1]);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Assessments retrieved successfully", data: assessments, meta });
});

const getAssessment = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await AssessmentService.getAssessmentForViewer(user.id, user.role, req.params["id"] ?? "");
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Assessment retrieved successfully", data });
});

const updateAssessment = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await AssessmentService.updateAssessment(user.id, req.params["id"] ?? "", req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Assessment updated successfully", data });
});

const deleteAssessment = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  await AssessmentService.deleteAssessment(user.id, req.params["id"] ?? "");
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Assessment deleted successfully", data: null });
});

const addProblem = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await AssessmentService.addProblem(user.id, req.params["id"] ?? "", req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: "Problem attached successfully", data });
});

const changeStatus = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await AssessmentService.changeStatus(user.id, req.params["id"] ?? "", req.body.status);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Assessment status updated successfully", data });
});

export const AssessmentController = {
  createAssessment,
  listAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
  addProblem,
  changeStatus,
};
