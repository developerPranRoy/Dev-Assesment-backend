import { z } from "zod";

const inviteZodSchema = z.object({
  body: z.object({
    emails: z.array(z.string().email()).min(1, "At least one email is required"),
  }),
});

export const InvitationValidation = { inviteZodSchema };
