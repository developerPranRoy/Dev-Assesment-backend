import { z } from "zod";

const registerZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).min(2),
    email: z.string({ required_error: "Email is required" }).email(),
    password: z.string({ required_error: "Password is required" }).min(8),
    role: z.enum(["CANDIDATE", "COMPANY"], { required_error: "Role is required" }),
  }),
});

const loginZodSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email(),
    password: z.string({ required_error: "Password is required" }),
  }),
});

const refreshTokenZodSchema = z.object({
  body: z.object({ refreshToken: z.string().optional() }).optional().default({}),
});

const googleExchangeZodSchema = z.object({
  body: z.object({
    code: z.string({ required_error: "Exchange code is required" }).min(10),
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
  googleExchangeZodSchema,
  updateMeZodSchema,
};
