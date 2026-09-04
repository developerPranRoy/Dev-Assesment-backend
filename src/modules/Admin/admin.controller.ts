import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AdminService } from "./admin.service";

const listUsers = catchAsync(async (req: Request, res: Response) => {
  const { users, meta } = await AdminService.listUsers(req.query as any);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users retrieved successfully",
    data: users,
    meta,
  });
});

const changeUserRole = catchAsync(async (req: Request, res: Response) => {
  const data = await AdminService.changeUserRole(req.user!.id, req.params.id, req.body.role);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User role updated successfully",
    data,
  });
});

const dashboardStats = catchAsync(async (req: Request, res: Response) => {
  const data = await AdminService.dashboardStats();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Dashboard stats retrieved successfully",
    data,
  });
});

const listAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const { logs, meta } = await AdminService.listAuditLogs(req.query as any);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Audit logs retrieved successfully",
    data: logs,
    meta,
  });
});

export const AdminController = {
  listUsers,
  changeUserRole,
  dashboardStats,
  listAuditLogs,
};
