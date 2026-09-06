import { z } from "zod";

const createCompanyZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Company name is required" }).min(2),
  }),
});

const addMemberZodSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email(),
    permissionLevel: z.enum(["CREATOR", "EVALUATOR"], { required_error: "Permission level is required" }),
  }),
});

export const CompanyValidation = { createCompanyZodSchema, addMemberZodSchema };
