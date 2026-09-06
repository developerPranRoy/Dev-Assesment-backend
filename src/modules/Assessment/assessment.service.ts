import httpStatus from "http-status";
import { AssessmentStatus, Prisma, Role } from "@prisma/client";
import ApiError from "../../shared/ApiError";
import { getPagination, buildMeta } from "../../shared/pagination";
import { logAudit } from "../../shared/auditLog";
import { AssessmentRepository } from "./assessment.repository";
import { ProblemRepository } from "../Problem/problem.repository";
import { CompanyService } from "../Company/company.service";
import { CompanyRepository } from "../Company/company.repository";
import { InvitationRepository } from "../Invitation/invitation.repository";
import { AuthRepository } from "../Auth/auth.repository";

const ALLOWED_TRANSITIONS: Record<AssessmentStatus, AssessmentStatus[]> = {
  DRAFT: ["PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: [],
};

const stripSecrets = (assessment: NonNullable<Awaited<ReturnType<typeof AssessmentRepository.findById>>>) => ({
  ...assessment,
  problems: assessment.problems.map((item) => ({
    ...item,
    problem: { ...item.problem, correctAnswer: null, testCases: null },
  })),
});

const createAssessment = async (
  userId: string,
  payload: { title: string; description?: string; durationMinutes: number; passingScore: number }
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
  const [assessments, total] = await AssessmentRepository.findMany({ companyId, status: query.status, skip, take: limit });
  return { assessments, meta: buildMeta(page, limit, total) };
};

const getAssessmentForViewer = async (userId: string, role: Role, id: string) => {
  const assessment = await AssessmentRepository.findById(id);
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");

  if (role === "ADMIN") return assessment;

  if (role === "COMPANY") {
    const membership = await CompanyRepository.findMember(assessment.companyId, userId);
    if (!membership) throw new ApiError(httpStatus.FORBIDDEN, "You cannot view this assessment");
    return assessment;
  }

  const candidate = await AuthRepository.findById(userId);
  const invitation =
    candidate && (await InvitationRepository.findByAssessmentAndEmail(id, candidate.email.toLowerCase()));
  if (!invitation || assessment.status !== "PUBLISHED") {
    throw new ApiError(httpStatus.FORBIDDEN, "You cannot view this assessment");
  }

  return stripSecrets(assessment);
};

const assertOwnership = async (userId: string, assessmentId: string) => {
  const assessment = await AssessmentRepository.findById(assessmentId);
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  const companyId = await CompanyService.resolveManagerContext(userId);
  if (assessment.companyId !== companyId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You cannot modify another company's assessment");
  }
  return assessment;
};

const updateAssessment = async (userId: string, id: string, payload: Record<string, unknown>) => {
  const assessment = await assertOwnership(userId, id);
  if (assessment.status !== "DRAFT") throw new ApiError(httpStatus.BAD_REQUEST, "Only draft assessments can be edited");
  return AssessmentRepository.update(id, payload as Prisma.AssessmentUpdateInput);
};

const deleteAssessment = async (userId: string, id: string) => {
  const assessment = await assertOwnership(userId, id);
  if (assessment.status === "PUBLISHED") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Archive the assessment before deleting it");
  }
  return AssessmentRepository.softDelete(id);
};

const addProblem = async (
  userId: string,
  assessmentId: string,
  payload: { problemId: string; order: number; points: number }
) => {
  const assessment = await assertOwnership(userId, assessmentId);
  if (assessment.status !== "DRAFT") throw new ApiError(httpStatus.BAD_REQUEST, "Problems can only be attached to draft assessments");
  const problem = await ProblemRepository.findById(payload.problemId);
  if (!problem || problem.companyId !== assessment.companyId) {
    throw new ApiError(httpStatus.NOT_FOUND, "Problem not found for this company");
  }
  return AssessmentRepository.addProblem({ assessmentId, ...payload });
};

const changeStatus = async (userId: string, id: string, status: AssessmentStatus) => {
  const assessment = await assertOwnership(userId, id);
  const allowed = ALLOWED_TRANSITIONS[assessment.status];
  if (!allowed.includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Cannot change assessment status from ${assessment.status} to ${status}`);
  }

  if (status === "PUBLISHED") {
    const problemCount = await AssessmentRepository.countProblems(id);
    if (problemCount === 0) throw new ApiError(httpStatus.BAD_REQUEST, "Add at least one problem before publishing");
  }

  const updated = await AssessmentRepository.update(id, { status });
  logAudit({ actorId: userId, action: `assessment.${status.toLowerCase()}`, entityType: "Assessment", entityId: id });
  return updated;
};

export const AssessmentService = {
  createAssessment,
  listAssessments,
  getAssessmentForViewer,
  updateAssessment,
  deleteAssessment,
  addProblem,
  changeStatus,
};
