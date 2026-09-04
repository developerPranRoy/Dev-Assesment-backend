import httpStatus from "http-status";
import { AssessmentStatus } from "@prisma/client";
import ApiError from "../../shared/ApiError";
import { getPagination, buildMeta } from "../../shared/pagination";
import { logAudit } from "../../shared/auditLog";
import { AssessmentRepository } from "./assessment.repository";
import { ProblemRepository } from "../Problem/problem.repository";
import { CompanyService } from "../Company/company.service";

const createAssessment = async (
  userId: string,
  payload: {
    title: string;
    description?: string;
    durationMinutes: number;
    passingScore: number;
  }
) => {
  const companyId = await CompanyService.resolveManagerContext(userId);
  return AssessmentRepository.create({ ...payload, companyId, createdById: userId });
};

const listAssessments = async (
  userId: string,
  query: { page?: string; limit?: string; status?: AssessmentStatus }
) => {
  const companyId = await CompanyService.resolveManagerContext(userId);
  const { page, limit, skip } = getPagination(query);
  const [assessments, total] = await AssessmentRepository.findMany({
    companyId,
    status: query.status,
    skip,
    take: limit,
  });
  return { assessments, meta: buildMeta(page, limit, total) };
};

const getAssessment = async (id: string) => {
  const assessment = await AssessmentRepository.findById(id);
  if (!assessment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  }
  return assessment;
};

const assertOwnership = async (userId: string, assessmentId: string) => {
  const assessment = await getAssessment(assessmentId);
  const companyId = await CompanyService.resolveManagerContext(userId);
  if (assessment.companyId !== companyId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You cannot modify another company's assessment");
  }
  return assessment;
};

const updateAssessment = async (
  userId: string,
  id: string,
  payload: Record<string, unknown>
) => {
  await assertOwnership(userId, id);
  return AssessmentRepository.update(id, payload as any);
};

const deleteAssessment = async (userId: string, id: string) => {
  await assertOwnership(userId, id);
  return AssessmentRepository.softDelete(id);
};

const addProblem = async (
  userId: string,
  assessmentId: string,
  payload: { problemId: string; order: number; points: number }
) => {
  const assessment = await assertOwnership(userId, assessmentId);
  const problem = await ProblemRepository.findById(payload.problemId);
  if (!problem || problem.companyId !== assessment.companyId) {
    throw new ApiError(httpStatus.NOT_FOUND, "Problem not found for this company");
  }
  return AssessmentRepository.addProblem({ assessmentId, ...payload });
};

const changeStatus = async (userId: string, id: string, status: AssessmentStatus) => {
  await assertOwnership(userId, id);

  if (status === "PUBLISHED") {
    const problemCount = await AssessmentRepository.countProblems(id);
    if (problemCount === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Add at least one problem before publishing");
    }
  }

  const updated = await AssessmentRepository.update(id, { status });

  await logAudit({
    actorId: userId,
    action: `assessment.${status.toLowerCase()}`,
    entityType: "Assessment",
    entityId: id,
  });

  return updated;
};

export const AssessmentService = {
  createAssessment,
  listAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
  addProblem,
  changeStatus,
};
