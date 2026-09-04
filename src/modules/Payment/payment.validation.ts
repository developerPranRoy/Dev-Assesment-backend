import { z } from "zod";

const initiateZodSchema = z.object({
  body: z.object({
    credits: z.number({ required_error: "Credits amount is required" }).int().positive(),
    provider: z.enum(["SSLCOMMERZ", "BKASH", "STRIPE"], {
      required_error: "Provider is required",
    }),
  }),
});

const webhookZodSchema = z.object({
  body: z.object({
    transactionId: z.string({ required_error: "Transaction id is required" }),
    status: z.enum(["SUCCESS", "FAILED"], { required_error: "Status is required" }),
  }),
});

export const PaymentValidation = {
  initiateZodSchema,
  webhookZodSchema,
};
