import { z } from "zod";

const createProblemZodSchema = z.object({
  body: z.object({
    type: z.enum(["CODING", "MCQ", "WRITTEN"]),
    title: z.string({ required_error: "Title is required" }).min(3),
    statement: z.string({ required_error: "Statement is required" }).min(10),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    tags: z.array(z.string()).optional(),
    points: z.number().int().positive().optional(),
    testCases: z.unknown().optional(),
    options: z.unknown().optional(),
    correctAnswer: z.string().optional(),
  }),
});

const updateProblemZodSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    statement: z.string().min(10).optional(),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    tags: z.array(z.string()).optional(),
    points: z.number().int().positive().optional(),
    testCases: z.unknown().optional(),
    options: z.unknown().optional(),
    correctAnswer: z.string().optional(),
  }),
});

export const ProblemValidation = {
  createProblemZodSchema,
  updateProblemZodSchema,
};
