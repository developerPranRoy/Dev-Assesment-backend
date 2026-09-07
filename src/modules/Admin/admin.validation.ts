import { z } from "zod";

const changeRoleZodSchema = z.object({
  body: z.object({
    role: z.enum(["CANDIDATE", "COMPANY", "ADMIN"], { required_error: "Role is required" }),
  }),
});

const blockIpZodSchema = z.object({
  body: z.object({
    ip: z.string({ required_error: "IP address is required" }).ip(),
    ttlHours: z.number().int().positive().optional(),
  }),
});

const unblockIpZodSchema = z.object({
  params: z.object({
    ip: z.string({ required_error: "IP address is required" }),
  }),
});

export const AdminValidation = {
  changeRoleZodSchema,
  blockIpZodSchema,
  unblockIpZodSchema,
};
