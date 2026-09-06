import prisma from "../../shared/prisma";
import { Prisma, AssessmentStatus } from "@prisma/client";

const create = (data: Prisma.AssessmentUncheckedCreateInput) =>
  prisma.assessment.create({ data });

const findMany = (params: { companyId: string; status?: AssessmentStatus; skip: number; take: number }) => {
  const where: Prisma.AssessmentWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.status && { status: params.status }),
  };
  return Promise.all([
    prisma.assessment.findMany({ where, skip: params.skip, take: params.take, orderBy: { createdAt: "desc" } }),
    prisma.assessment.count({ where }),
  ]);
};

const findById = (id: string) =>
  prisma.assessment.findFirst({
    where: { id, deletedAt: null },
    include: { problems: { include: { problem: true } } },
  });

const hasProblem = (assessmentId: string, problemId: string) =>
  prisma.assessmentProblem.findUnique({
    where: { assessmentId_problemId: { assessmentId, problemId } },
  });

const update = (id: string, data: Prisma.AssessmentUpdateInput) =>
  prisma.assessment.update({ where: { id }, data });

const softDelete = (id: string) =>
  prisma.assessment.update({ where: { id }, data: { deletedAt: new Date() } });

const countProblems = (assessmentId: string) =>
  prisma.assessmentProblem.count({ where: { assessmentId } });

const addProblem = (data: { assessmentId: string; problemId: string; order: number; points: number }) =>
  prisma.assessmentProblem.create({ data });

export const AssessmentRepository = {
  create,
  findMany,
  findById,
  hasProblem,
  update,
  softDelete,
  countProblems,
  addProblem,
};
