import { z } from "zod";

const initiateZodSchema = z.object({
  body: z.object({
    credits: z.number({ required_error: "Credits amount is required" }).int().positive(),
  }),
});

export const PaymentValidation = { initiateZodSchema };
