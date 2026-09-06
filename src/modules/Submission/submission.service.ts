import httpStatus from "http-status";
import { Role } from "@prisma/client";
import ApiError from "../../shared/ApiError";
import prisma from "../../shared/prisma";
import config from "../../config";
import { SubmissionRepository } from "./submission.repository";
import { AttemptRepository } from "../Attempt/attempt.repository";
import { ProblemRepository } from "../Problem/problem.repository";
import { CompanyRepository } from "../Company/company.repository";
import { AssessmentRepository } from "../Assessment/assessment.repository";
import { enqueueGrading } from "../../lib/queue";

const normalizeMcqAnswer = (answer: unknown): string => {
  if (typeof answer === "string" || typeof answer === "number") return String(answer);
  if (answer && typeof answer === "object") {
    const record = answer as Record<string, unknown>;
    const value = record["selected"] ?? record["answer"] ?? record["option"] ?? record["value"];
    if (value !== undefined) return String(value);
  }
  return "";
};

const submitAnswer = async (
  candidateId: string,
  attemptId: string,
  payload: { problemId: string; answer: unknown; languageId?: number }
) => {
  const attempt = await AttemptRepository.findById(attemptId);
  if (!attempt || attempt.candidateId !== candidateId) {
    throw new ApiError(httpStatus.NOT_FOUND, "Attempt not found");
  }
  if (attempt.status !== "IN_PROGRESS") {
    throw new ApiError(httpStatus.BAD_REQUEST, "This attempt is not accepting submissions");
  }

  const attached = await AssessmentRepository.hasProblem(attempt.assessmentId, payload.problemId);
  if (!attached) throw new ApiError(httpStatus.BAD_REQUEST, "This problem is not part of the assessment");

  const existing = await SubmissionRepository.findByAttemptAndProblem(attemptId, payload.problemId);
  if (existing) throw new ApiError(httpStatus.CONFLICT, "This problem has already been answered");

  const problem = await ProblemRepository.findById(payload.problemId);
  if (!problem) throw new ApiError(httpStatus.NOT_FOUND, "Problem not found");

  let status: "PENDING" | "EVALUATED" = "PENDING";
  let autoScore: number | undefined;

  if (problem.type === "MCQ") {
    const isCorrect = normalizeMcqAnswer(payload.answer) === String(problem.correctAnswer ?? "");
    status = "EVALUATED";
    autoScore = isCorrect ? problem.points : 0;
  }

  const submission = await SubmissionRepository.create({
    attemptId,
    problemId: payload.problemId,
    answer: payload.answer,
    status,
    autoScore,
  });

  if (problem.type === "CODING" && payload.languageId && problem.testCases && config.judge0.apiUrl) {
    const testCases = problem.testCases as { input: string; expectedOutput: string }[];
    const code = String((payload.answer as { code?: string })?.code ?? payload.answer ?? "");
    await enqueueGrading({ submissionId: submission.id, code, languageId: payload.languageId, testCases, points: problem.points });
  }

  return submission;
};

const evaluateSubmission = async (evaluatorId: string, submissionId: string, manualScore: number) => {
  const submission = await SubmissionRepository.findById(submissionId);
  if (!submission) throw new ApiError(httpStatus.NOT_FOUND, "Submission not found");

  const membership = await CompanyRepository.findMember(submission.problem.companyId, evaluatorId);
  if (!membership) throw new ApiError(httpStatus.FORBIDDEN, "You cannot evaluate this submission");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.submission.update({
      where: { id: submissionId },
      data: { status: "EVALUATED", manualScore, evaluatedById: evaluatorId, evaluatedAt: new Date() },
    });

    const submissions = await tx.submission.findMany({ where: { attemptId: submission.attemptId } });
    const allEvaluated = submissions.every((s) => s.status === "EVALUATED");
    const total = submissions.reduce((sum, s) => sum + (s.manualScore ?? s.autoScore ?? 0), 0);

    await tx.attempt.update({
      where: { id: submission.attemptId },
      data: { score: total, ...(allEvaluated && { status: "EVALUATED" }) },
    });

    await tx.auditLog.create({
      data: {
        actorId: evaluatorId,
        action: "submission.evaluated",
        entityType: "Submission",
        entityId: submissionId,
        metadata: { manualScore },
      },
    });

    return updated;
  });
};

const getScore = async (userId: string, role: Role, attemptId: string) => {
  const attempt = await AttemptRepository.findById(attemptId);
  if (!attempt) throw new ApiError(httpStatus.NOT_FOUND, "Attempt not found");

  if (attempt.candidateId !== userId) {
    if (role === "ADMIN") {
    } else if (role === "COMPANY") {
      const membership = await CompanyRepository.findMember(attempt.assessment.companyId, userId);
      if (!membership) throw new ApiError(httpStatus.FORBIDDEN, "You cannot view this score");
    } else {
      throw new ApiError(httpStatus.FORBIDDEN, "You cannot view this score");
    }
  }

  return { status: attempt.status, score: attempt.score };
};

export const SubmissionService = { submitAnswer, evaluateSubmission, getScore };
