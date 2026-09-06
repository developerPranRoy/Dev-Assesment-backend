import httpStatus from "http-status";
import { Difficulty, ProblemType } from "@prisma/client";
import ApiError from "../../shared/ApiError";
import { getPagination, buildMeta } from "../../shared/pagination";
import { ProblemRepository } from "./problem.repository";
import { CompanyService } from "../Company/company.service";

const createProblem = async (
  userId: string,
  payload: {
    type: ProblemType;
    title: string;
    statement: string;
    difficulty: Difficulty;
    tags?: string[];
    points?: number;
    testCases?: unknown;
    options?: unknown;
    correctAnswer?: string;
  }
) => {
  const companyId = await CompanyService.resolveManagerContext(userId);
  return ProblemRepository.create({
    ...payload,
    tags: payload.tags ?? [],
    points: payload.points ?? 0,
    testCases: payload.testCases as never,
    options: payload.options as never,
    companyId,
    createdById: userId,
  });
};

const listProblems = async (
  userId: string,
  query: { page?: string; limit?: string; type?: ProblemType; difficulty?: Difficulty; search?: string }
) => {
  const companyId = await CompanyService.resolveManagerContext(userId);
  const { page, limit, skip } = getPagination(query);
  const [problems, total] = await ProblemRepository.findMany({
    companyId,
    type: query.type,
    difficulty: query.difficulty,
    search: query.search,
    skip,
    take: limit,
  });
  return { problems, meta: buildMeta(page, limit, total) };
};

const getProblem = async (userId: string, id: string) => {
  const problem = await ProblemRepository.findById(id);
  if (!problem) throw new ApiError(httpStatus.NOT_FOUND, "Problem not found");
  const companyId = await CompanyService.resolveManagerContext(userId);
  if (companyId !== problem.companyId) throw new ApiError(httpStatus.FORBIDDEN, "You cannot view another company's problem");
  return problem;
};

const updateProblem = async (userId: string, id: string, payload: Record<string, unknown>) => {
  await getProblem(userId, id);
  return ProblemRepository.update(id, payload as never);
};

const deleteProblem = async (userId: string, id: string) => {
  await getProblem(userId, id);
  return ProblemRepository.softDelete(id);
};

export const ProblemService = { createProblem, listProblems, getProblem, updateProblem, deleteProblem };
