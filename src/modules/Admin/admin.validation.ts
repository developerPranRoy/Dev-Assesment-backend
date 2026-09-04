import { z } from "zod";

const changeRoleZodSchema = z.object({
  body: z.object({
    role: z.enum(["CANDIDATE", "COMPANY", "ADMIN"], { required_error: "Role is required" }),
  }),
});

export const AdminValidation = {
  changeRoleZodSchema,
};
