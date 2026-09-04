import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ProblemService } from "./problem.service";

const createProblem = catchAsync(async (req: Request, res: Response) => {
  const data = await ProblemService.createProblem(req.user!.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Problem created successfully",
    data,
  });
});

const listProblems = catchAsync(async (req: Request, res: Response) => {
  const { problems, meta } = await ProblemService.listProblems(
    req.user!.id,
    req.query as any
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Problems retrieved successfully",
    data: problems,
    meta,
  });
});

const searchProblems = catchAsync(async (req: Request, res: Response) => {
  const { problems, meta } = await ProblemService.listProblems(req.user!.id, {
    ...(req.query as any),
    search: req.query.q as string,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Search results",
    data: problems,
    meta,
  });
});

const getProblem = catchAsync(async (req: Request, res: Response) => {
  const data = await ProblemService.getProblem(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Problem retrieved successfully",
    data,
  });
});

const updateProblem = catchAsync(async (req: Request, res: Response) => {
  const data = await ProblemService.updateProblem(req.user!.id, req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Problem updated successfully",
    data,
  });
});

const deleteProblem = catchAsync(async (req: Request, res: Response) => {
  await ProblemService.deleteProblem(req.user!.id, req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Problem deleted successfully",
    data: null,
  });
});

export const ProblemController = {
  createProblem,
  listProblems,
  searchProblems,
  getProblem,
  updateProblem,
  deleteProblem,
};
