import { z } from "zod";

const createAssessmentZodSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Title is required" }).min(3),
    description: z.string().optional(),
    durationMinutes: z.number({ required_error: "Duration is required" }).int().positive(),
    passingScore: z.number({ required_error: "Passing score is required" }).int().nonnegative(),
  }),
});

const updateAssessmentZodSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    durationMinutes: z.number().int().positive().optional(),
    passingScore: z.number().int().nonnegative().optional(),
  }),
});

const addProblemZodSchema = z.object({
  body: z.object({
    problemId: z.string({ required_error: "Problem id is required" }),
    order: z.number().int().nonnegative(),
    points: z.number().int().positive(),
  }),
});

const changeStatusZodSchema = z.object({
  body: z.object({
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"], {
      required_error: "Status is required",
    }),
  }),
});

export const AssessmentValidation = {
  createAssessmentZodSchema,
  updateAssessmentZodSchema,
  addProblemZodSchema,
  changeStatusZodSchema,
};
