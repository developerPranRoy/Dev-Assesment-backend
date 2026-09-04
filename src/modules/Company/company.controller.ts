import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { CompanyService } from "./company.service";

const createCompany = catchAsync(async (req: Request, res: Response) => {
  const data = await CompanyService.createCompany(req.user!.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Company created successfully",
    data,
  });
});

const getCompany = catchAsync(async (req: Request, res: Response) => {
  const data = await CompanyService.getCompany(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Company retrieved successfully",
    data,
  });
});

const addMember = catchAsync(async (req: Request, res: Response) => {
  const data = await CompanyService.addMember(req.user!.id, req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Member added successfully",
    data,
  });
});

export const CompanyController = {
  createCompany,
  getCompany,
  addMember,
};
