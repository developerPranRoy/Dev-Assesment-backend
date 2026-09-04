import { z } from "zod";

const registerZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).min(2),
    email: z.string({ required_error: "Email is required" }).email(),
    password: z.string({ required_error: "Password is required" }).min(6),
    role: z.enum(["CANDIDATE", "COMPANY"], {
      required_error: "Role is required",
    }),
  }),
});

const loginZodSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email(),
    password: z.string({ required_error: "Password is required" }),
  }),
});

const refreshTokenZodSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: "Refresh token is required" }),
  }),
});

const updateMeZodSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    avatarUrl: z.string().url().optional(),
  }),
});

export const AuthValidation = {
  registerZodSchema,
  loginZodSchema,
  refreshTokenZodSchema,
  updateMeZodSchema,
};
