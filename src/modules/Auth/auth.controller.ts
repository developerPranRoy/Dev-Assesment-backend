import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthService } from "./auth.service";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const data = await AuthService.registerUser(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Account created successfully",
    data,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const data = await AuthService.loginUser(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Logged in successfully",
    data,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const data = await AuthService.refreshToken(req.body.refreshToken);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Access token refreshed",
    data,
  });
});

const googleAuth = catchAsync(async (req: Request, res: Response) => {
  const data = await AuthService.googleAuth(req.body.idToken);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Logged in with Google successfully",
    data,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Logged out successfully",
    data: null,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const data = await AuthService.getMe(req.user!.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Profile retrieved successfully",
    data,
  });
});

const updateMe = catchAsync(async (req: Request, res: Response) => {
  const data = await AuthService.updateMe(req.user!.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Profile updated successfully",
    data,
  });
});

export const AuthController = {
  registerUser,
  loginUser,
  refreshToken,
  googleAuth,
  logout,
  getMe,
  updateMe,
};
