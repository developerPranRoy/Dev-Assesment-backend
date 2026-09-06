import prisma from "../../shared/prisma";
import { Prisma, Difficulty, ProblemType } from "@prisma/client";

const create = (data: Prisma.ProblemUncheckedCreateInput) =>
  prisma.problem.create({ data });

const findMany = (params: {
  companyId: string;
  type?: ProblemType;
  difficulty?: Difficulty;
  search?: string;
  skip: number;
  take: number;
}) => {
  const where: Prisma.ProblemWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.type && { type: params.type }),
    ...(params.difficulty && { difficulty: params.difficulty }),
    ...(params.search && { title: { contains: params.search, mode: "insensitive" } }),
  };

  return Promise.all([
    prisma.problem.findMany({ where, skip: params.skip, take: params.take, orderBy: { createdAt: "desc" } }),
    prisma.problem.count({ where }),
  ]);
};

const findById = (id: string) =>
  prisma.problem.findFirst({ where: { id, deletedAt: null } });

const update = (id: string, data: Prisma.ProblemUpdateInput) =>
  prisma.problem.update({ where: { id }, data });

const softDelete = (id: string) =>
  prisma.problem.update({ where: { id }, data: { deletedAt: new Date() } });

export const ProblemRepository = { create, findMany, findById, update, softDelete };
