import { z } from "zod";

const submitAnswerZodSchema = z.object({
  body: z.object({
    problemId: z.string({ required_error: "Problem id is required" }),
    answer: z.unknown(),
    languageId: z.number().int().optional(),
  }),
});

const evaluateZodSchema = z.object({
  body: z.object({
    manualScore: z.number({ required_error: "Score is required" }).int().nonnegative(),
  }),
});

export const SubmissionValidation = { submitAnswerZodSchema, evaluateZodSchema };
