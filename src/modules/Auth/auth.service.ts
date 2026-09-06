import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { Role } from "@prisma/client";
import ApiError from "../../shared/ApiError";
import config from "../../config";
import { AuthRepository } from "./auth.repository";
import { TokenUtils } from "./auth.utils";
import {
  getGoogleAuthUrl,
  getGoogleProfile,
  assertValidGoogleState,
  storeGoogleLoginCode,
  consumeGoogleLoginCode,
} from "../../lib/google";
import { blacklistToken, isTokenBlacklisted } from "../../lib/tokenBlacklist";
import { uploadBuffer } from "../../lib/cloudinary";

const issueForUser = async (userId: string, role: Role) => {
  const tokens = TokenUtils.issueTokenPair({ id: userId, role });
  const user = await AuthRepository.findById(userId);
  return { user, ...tokens };
};

const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
  role: "CANDIDATE" | "COMPANY";
}) => {
  const email = payload.email.toLowerCase();
  const existing = await AuthRepository.findByEmail(email);
  if (existing) throw new ApiError(httpStatus.CONFLICT, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(payload.password, config.bcrypt.saltRounds);
  const user = await AuthRepository.create({
    name: payload.name,
    email,
    passwordHash,
    provider: "LOCAL",
    role: payload.role as Role,
  });

  return issueForUser(user.id, user.role);
};

const loginUser = async (payload: { email: string; password: string }) => {
  const userWithPassword = await AuthRepository.findByEmail(payload.email.toLowerCase());
  if (!userWithPassword || !userWithPassword.passwordHash) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(payload.password, userWithPassword.passwordHash);
  if (!isPasswordValid) throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");

  return issueForUser(userWithPassword.id, userWithPassword.role);
};

const refreshToken = async (token?: string) => {
  if (!token) throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token is required");

  let decoded;
  try {
    decoded = TokenUtils.verifyRefreshToken(token);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  if (await isTokenBlacklisted(decoded.jti)) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Token has been revoked");
  }

  const user = await AuthRepository.findById(decoded.id);
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "User no longer exists");

  await blacklistToken(token);
  return issueForUser(user.id, user.role);
};

const getGoogleRedirectUrl = () => {
  if (!config.google.clientId || !config.google.clientSecret) {
    throw new ApiError(httpStatus.NOT_IMPLEMENTED, "Google login is not configured yet");
  }
  return getGoogleAuthUrl();
};

const handleGoogleCallback = async (code: string, state?: string) => {
  if (!config.google.clientId) {
    throw new ApiError(httpStatus.NOT_IMPLEMENTED, "Google login is not configured yet");
  }

  const validState = await assertValidGoogleState(state);
  if (!validState) throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired Google login state");

  const profile = await getGoogleProfile(code);
  const email = profile.email.toLowerCase();

  const existingByGoogleId = await AuthRepository.findByGoogleId(profile.googleId);

  let userId: string;
  let userRole: Role;

  if (existingByGoogleId) {
    userId = existingByGoogleId.id;
    userRole = existingByGoogleId.role;
  } else {
    const existingByEmail = await AuthRepository.findByEmail(email);
    if (existingByEmail) {
      await AuthRepository.linkGoogleAccount(existingByEmail.id, profile.googleId);
      userId = existingByEmail.id;
      userRole = existingByEmail.role;
    } else {
      const created = await AuthRepository.create({
        name: profile.name,
        email,
        provider: "GOOGLE",
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl,
        role: "CANDIDATE",
      });
      userId = created.id;
      userRole = created.role;
    }
  }

  const session = await issueForUser(userId, userRole);

  if (config.frontendUrl) {
    const oneTimeCode = await storeGoogleLoginCode(session);
    return { redirectTo: `${config.frontendUrl.replace(/\/$/, "")}/auth/google/callback?code=${oneTimeCode}` };
  }

  return session;
};

const exchangeGoogleCode = async (code: string) => {
  const session = await consumeGoogleLoginCode(code);
  if (!session) throw new ApiError(httpStatus.UNAUTHORIZED, "Google login code is invalid or expired");
  return session as Awaited<ReturnType<typeof issueForUser>>;
};

const logout = async (accessToken?: string, refreshTokenValue?: string) => {
  if (accessToken) await blacklistToken(accessToken);
  if (refreshTokenValue) await blacklistToken(refreshTokenValue);
};

const getMe = async (userId: string) => {
  const user = await AuthRepository.findById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  return user;
};

const updateMe = (userId: string, payload: { name?: string; avatarUrl?: string }) =>
  AuthRepository.update(userId, payload);

const uploadAvatar = async (userId: string, file?: Express.Multer.File) => {
  if (!file) throw new ApiError(httpStatus.BAD_REQUEST, "Avatar file is required");
  const uploaded = await uploadBuffer(file.buffer, { folder: "dev-assessment/avatars", resourceType: "image" });
  return AuthRepository.update(userId, { avatarUrl: uploaded.url });
};

const uploadResume = async (userId: string, role: Role, file?: Express.Multer.File) => {
  if (role !== "CANDIDATE") throw new ApiError(httpStatus.FORBIDDEN, "Only candidates can upload a resume");
  if (!file) throw new ApiError(httpStatus.BAD_REQUEST, "Resume file is required");
  const uploaded = await uploadBuffer(file.buffer, { folder: "dev-assessment/resumes", resourceType: "auto" });
  await AuthRepository.updateResume(userId, uploaded.url);
  return AuthRepository.findById(userId);
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshToken,
  getGoogleRedirectUrl,
  handleGoogleCallback,
  exchangeGoogleCode,
  logout,
  getMe,
  updateMe,
  uploadAvatar,
  uploadResume,
};
