import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import config from "../config";
import redis from "./redis";

export const googleClient = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.callbackUrl
);

export const getGoogleAuthUrl = async () => {
  const state = crypto.randomBytes(24).toString("hex");
  await redis.set(`oauth:state:${state}`, "1", "EX", 10 * 60);
  return googleClient.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    state,
  });
};

export const assertValidGoogleState = async (state?: string) => {
  if (!state) return false;
  const key = `oauth:state:${state}`;
  const exists = await redis.get(key);
  if (!exists) return false;
  await redis.del(key);
  return true;
};

export const storeGoogleLoginCode = async (payload: unknown) => {
  const code = crypto.randomBytes(24).toString("hex");
  await redis.set(`oauth:login:${code}`, JSON.stringify(payload), "EX", 60);
  return code;
};

export const consumeGoogleLoginCode = async (code: string) => {
  const key = `oauth:login:${code}`;
  const raw = await redis.get(key);
  if (!raw) return null;
  await redis.del(key);
  return JSON.parse(raw);
};

export const getGoogleProfile = async (code: string) => {
  const { tokens } = await googleClient.getToken(code);
  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token as string,
    audience: config.google.clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new Error("Google account has no email on file");
  }
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    avatarUrl: payload.picture,
  };
};
