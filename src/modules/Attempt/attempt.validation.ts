import { z } from "zod";

const heartbeatZodSchema = z.object({
  body: z.object({
    event: z.string({ required_error: "Event is required" }),
  }),
});

export const AttemptValidation = {
  heartbeatZodSchema,
};
