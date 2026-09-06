import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import ApiError from "../../shared/ApiError";
import { requireUser } from "../../middlewares/auth";
import { AuthService } from "./auth.service";
import { TokenUtils } from "./auth.utils";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const data = await AuthService.registerUser(req.body);
  TokenUtils.setRefreshCookie(res, data.refreshToken);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: "Account created successfully", data });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const data = await AuthService.loginUser(req.body);
  TokenUtils.setRefreshCookie(res, data.refreshToken);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Logged in successfully", data });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token =
    (req.body?.refreshToken as string | undefined) ||
    (req.cookies?.[TokenUtils.REFRESH_COOKIE] as string | undefined);
  const data = await AuthService.refreshToken(token);
  TokenUtils.setRefreshCookie(res, data.refreshToken);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Access token refreshed", data });
});

const redirectToGoogle = catchAsync(async (_req: Request, res: Response) => {
  const url = await AuthService.getGoogleRedirectUrl();
  res.redirect(url);
});

const googleCallback = catchAsync(async (req: Request, res: Response) => {
  if (req.query.error) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Google login was cancelled or failed: ${req.query.error}`);
  }
  const code = req.query.code as string;
  if (!code) throw new ApiError(httpStatus.BAD_REQUEST, "Missing authorization code");

  const data = await AuthService.handleGoogleCallback(code, req.query.state as string | undefined);

  if ("redirectTo" in data && data.redirectTo) {
    res.redirect(data.redirectTo);
    return;
  }

  TokenUtils.setRefreshCookie(res, (data as { refreshToken: string }).refreshToken);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Logged in with Google successfully", data });
});

const exchangeGoogleCode = catchAsync(async (req: Request, res: Response) => {
  const data = await AuthService.exchangeGoogleCode(req.body.code);
  TokenUtils.setRefreshCookie(res, data.refreshToken);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Logged in with Google successfully", data });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : undefined;
  const token =
    (req.body?.refreshToken as string | undefined) ||
    (req.cookies?.[TokenUtils.REFRESH_COOKIE] as string | undefined);
  await AuthService.logout(accessToken, token);
  TokenUtils.clearRefreshCookie(res);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Logged out successfully", data: null });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await AuthService.getMe(user.id);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Profile retrieved successfully", data });
});

const updateMe = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await AuthService.updateMe(user.id, req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Profile updated successfully", data });
});

const uploadAvatar = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await AuthService.uploadAvatar(user.id, req.file);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Avatar uploaded successfully", data });
});

const uploadResume = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await AuthService.uploadResume(user.id, user.role, req.file);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Resume uploaded successfully", data });
});

export const AuthController = {
  registerUser,
  loginUser,
  refreshToken,
  redirectToGoogle,
  googleCallback,
  exchangeGoogleCode,
  logout,
  getMe,
  updateMe,
  uploadAvatar,
  uploadResume,
};
