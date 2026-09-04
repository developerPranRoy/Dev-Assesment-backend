import httpStatus from "http-status";
import ApiError from "../../shared/ApiError";
import prisma from "../../shared/prisma";
import { SubmissionRepository } from "./submission.repository";
import { AttemptRepository } from "../Attempt/attempt.repository";
import { ProblemRepository } from "../Problem/problem.repository";
import { CompanyRepository } from "../Company/company.repository";
import { Judge0Client } from "../../lib/judge0";

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

  const existing = await SubmissionRepository.findByAttemptAndProblem(attemptId, payload.problemId);
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, "This problem has already been answered");
  }

  const problem = await ProblemRepository.findById(payload.problemId);
  if (!problem) {
    throw new ApiError(httpStatus.NOT_FOUND, "Problem not found");
  }

  const submission = await SubmissionRepository.create({
    attemptId,
    problemId: payload.problemId,
    answer: payload.answer,
  });


  if (problem.type === "MCQ") {
    const isCorrect = String(payload.answer) === problem.correctAnswer;
    return SubmissionRepository.update(submission.id, {
      status: "EVALUATED",
      autoScore: isCorrect ? problem.points : 0,
    });
  }

  if (problem.type === "CODING" && payload.languageId && problem.testCases) {
    const testCases = problem.testCases as { input: string; expectedOutput: string }[];
    const code = String((payload.answer as { code?: string })?.code ?? "");
    const results = await Judge0Client.runTestCases(code, payload.languageId, testCases);
    const passedCount = results.filter((r) => r.passed).length;
    const autoScore = Math.round((passedCount / testCases.length) * problem.points);
    return SubmissionRepository.update(submission.id, { status: "EVALUATED", autoScore });
  }

  return submission;
};

const evaluateSubmission = async (
  evaluatorId: string,
  submissionId: string,
  manualScore: number
) => {
  const submission = await SubmissionRepository.findById(submissionId);
  if (!submission) {
    throw new ApiError(httpStatus.NOT_FOUND, "Submission not found");
  }

  const membership = await CompanyRepository.findMembershipByUserId(evaluatorId);
  if (!membership || membership.companyId !== submission.problem.companyId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You cannot evaluate this submission");
  }

  // Same transaction: update the submission, recompute the attempt's total,
  // and flip the attempt to EVALUATED only once every submission is graded —
  // avoids a race with a concurrent evaluation on a sibling problem.
  return prisma.$transaction(async (tx) => {
    const updated = await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: "EVALUATED",
        manualScore,
        evaluatedById: evaluatorId,
        evaluatedAt: new Date(),
      },
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

const getScore = async (attemptId: string) => {
  const attempt = await AttemptRepository.findById(attemptId);
  if (!attempt) {
    throw new ApiError(httpStatus.NOT_FOUND, "Attempt not found");
  }
  return { status: attempt.status, score: attempt.score };
};

export const SubmissionService = {
  submitAnswer,
  evaluateSubmission,
  getScore,
};
