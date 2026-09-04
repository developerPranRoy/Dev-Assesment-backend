import prisma from "../../shared/prisma";
import { AttemptStatus } from "@prisma/client";

const findActive = (assessmentId: string, candidateId: string) =>
  prisma.attempt.findUnique({
    where: { assessmentId_candidateId: { assessmentId, candidateId } },
  });

const create = (data: { assessmentId: string; candidateId: string; startedAt: Date }) =>
  prisma.attempt.create({ data: { ...data, status: "IN_PROGRESS" } });

const findById = (id: string) =>
  prisma.attempt.findUnique({ where: { id }, include: { assessment: true } });

const update = (
  id: string,
  data: {
    status?: AttemptStatus;
    submittedAt?: Date;
    score?: number;
    flaggedEvents?: unknown;
  }
) => prisma.attempt.update({ where: { id }, data: data as any });

const findMyHistory = (candidateId: string) =>
  prisma.attempt.findMany({ where: { candidateId }, orderBy: { createdAt: "desc" } });

export const AttemptRepository = {
  findActive,
  create,
  findById,
  update,
  findMyHistory,
};
