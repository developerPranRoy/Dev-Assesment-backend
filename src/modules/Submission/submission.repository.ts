import prisma from "../../shared/prisma";

const create = (data: {
  attemptId: string;
  problemId: string;
  answer: unknown;
  status?: "PENDING" | "EVALUATED";
  autoScore?: number;
}) => prisma.submission.create({ data: data as never });

const findByAttemptAndProblem = (attemptId: string, problemId: string) =>
  prisma.submission.findUnique({
    where: { attemptId_problemId: { attemptId, problemId } },
  });

const findById = (id: string) =>
  prisma.submission.findUnique({ where: { id }, include: { problem: true, attempt: true } });

const update = (
  id: string,
  data: {
    status?: "PENDING" | "EVALUATED";
    autoScore?: number;
    manualScore?: number;
    evaluatedById?: string;
    evaluatedAt?: Date;
  }
) => prisma.submission.update({ where: { id }, data: data as never });

export const SubmissionRepository = { create, findByAttemptAndProblem, findById, update };
