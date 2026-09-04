import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { Role } from "@prisma/client";
import ApiError from "../../shared/ApiError";
import config from "../../config";
import { AuthRepository } from "./auth.repository";
import { TokenUtils } from "./auth.utils";

const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
  role: "CANDIDATE" | "COMPANY";
}) => {
  const existing = await AuthRepository.findByEmail(payload.email);
  if (existing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "An account with this email already exists"
    );
  }

  const passwordHash = await bcrypt.hash(
    payload.password,
    config.bcrypt.saltRounds
  );

  const user = await AuthRepository.create({
    name: payload.name,
    email: payload.email,
    passwordHash,
    provider: "LOCAL",
    role: payload.role as Role,
  });

  const accessToken = TokenUtils.generateAccessToken({
    id: user.id,
    role: user.role,
  });
  const refreshToken = TokenUtils.generateRefreshToken({
    id: user.id,
    role: user.role,
  });

  return { user, accessToken, refreshToken };
};

const loginUser = async (payload: { email: string; password: string }) => {
  const userWithPassword = await AuthRepository.findByEmail(payload.email);
  if (!userWithPassword || !userWithPassword.passwordHash) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    userWithPassword.passwordHash
  );
  if (!isPasswordValid) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  const accessToken = TokenUtils.generateAccessToken({
    id: userWithPassword.id,
    role: userWithPassword.role,
  });
  const refreshToken = TokenUtils.generateRefreshToken({
    id: userWithPassword.id,
    role: userWithPassword.role,
  });

  const user = await AuthRepository.findById(userWithPassword.id);

  return { user, accessToken, refreshToken };
};

const refreshToken = async (token: string) => {
  let decoded;
  try {
    decoded = TokenUtils.verifyRefreshToken(token);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  const user = await AuthRepository.findById(decoded.id);
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User no longer exists");
  }

  const accessToken = TokenUtils.generateAccessToken({
    id: user.id,
    role: user.role,
  });

  return { accessToken };
};

const googleAuth = async (_idToken: string) => {
  throw new ApiError(
    httpStatus.NOT_IMPLEMENTED,
    "Google login is not configured yet"
  );
};

const getMe = async (userId: string) => {
  const user = await AuthRepository.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  return user;
};

const updateMe = async (
  userId: string,
  payload: { name?: string; avatarUrl?: string }
) => AuthRepository.update(userId, payload);

export const AuthService = {
  registerUser,
  loginUser,
  refreshToken,
  googleAuth,
  getMe,
  updateMe,
};
