import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { requireUser } from "../../middlewares/auth";
import { AdminService } from "./admin.service";

const listUsers = catchAsync(async (req: Request, res: Response) => {
  const { users, meta } = await AdminService.listUsers(req.query as Parameters<typeof AdminService.listUsers>[0]);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Users retrieved successfully", data: users, meta });
});

const changeUserRole = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await AdminService.changeUserRole(user.id, req.params["id"] ?? "", req.body.role);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "User role updated successfully", data });
});

const dashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const data = await AdminService.dashboardStats();
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Dashboard stats retrieved successfully", data });
});

const listAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const { logs, meta } = await AdminService.listAuditLogs(req.query as Parameters<typeof AdminService.listAuditLogs>[0]);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Audit logs retrieved successfully", data: logs, meta });
});

const blockIp = catchAsync(async (req: Request, res: Response) => {
  const admin = requireUser(req);
  const data = await AdminService.blockIpAddress(admin.id, req.body.ip, req.body.ttlHours);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: `IP ${req.body.ip} blocked successfully`, data });
});

const unblockIp = catchAsync(async (req: Request, res: Response) => {
  const admin = requireUser(req);
  const ip = req.params["ip"] ?? "";
  const data = await AdminService.unblockIpAddress(admin.id, decodeURIComponent(ip));
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: `IP ${ip} unblocked successfully`, data });
});

const listBlockedIps = catchAsync(async (_req: Request, res: Response) => {
  const data = await AdminService.listBlockedIpAddresses();
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Blocked IPs retrieved successfully", data });
});

export const AdminController = {
  listUsers,
  changeUserRole,
  dashboardStats,
  listAuditLogs,
  blockIp,
  unblockIp,
  listBlockedIps,
};
