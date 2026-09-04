import prisma from "../../shared/prisma";

const create = (data: { attemptId: string; problemId: string; answer: unknown }) =>
  prisma.submission.create({ data: data as any });

const findByAttemptAndProblem = (attemptId: string, problemId: string) =>
  prisma.submission.findUnique({
    where: { attemptId_problemId: { attemptId, problemId } },
  });

const findById = (id: string) =>
  prisma.submission.findUnique({
    where: { id },
    include: { problem: true, attempt: true },
  });

const update = (
  id: string,
  data: {
    status?: "PENDING" | "EVALUATED";
    autoScore?: number;
    manualScore?: number;
    evaluatedById?: string;
    evaluatedAt?: Date;
  }
) => prisma.submission.update({ where: { id }, data: data as any });

export const SubmissionRepository = {
  create,
  findByAttemptAndProblem,
  findById,
  update,
};
