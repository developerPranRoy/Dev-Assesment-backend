import httpStatus from "http-status";
import ApiError from "../../shared/ApiError";
import prisma from "../../shared/prisma";
import { AttemptRepository } from "./attempt.repository";
import { AssessmentRepository } from "../Assessment/assessment.repository";
import { InvitationRepository } from "../Invitation/invitation.repository";
import { AuthRepository } from "../Auth/auth.repository";

type AttemptWithAssessment = NonNullable<Awaited<ReturnType<typeof AttemptRepository.findById>>>;

/** Recomputes status against the clock — never trust a stale IN_PROGRESS row. */
const resolveExpiry = async (attempt: AttemptWithAssessment) => {
  if (attempt.status !== "IN_PROGRESS" || !attempt.startedAt) {
    return attempt;
  }
  const deadline = new Date(
    attempt.startedAt.getTime() + attempt.assessment.durationMinutes * 60_000
  );
  if (new Date() > deadline) {
    return prisma.attempt.update({
      where: { id: attempt.id },
      data: { status: "EXPIRED" },
      include: { assessment: true },
    });
  }
  return attempt;
};

const startAttempt = async (candidateId: string, assessmentId: string) => {
  const assessment = await AssessmentRepository.findById(assessmentId);
  if (!assessment || assessment.status !== "PUBLISHED") {
    throw new ApiError(httpStatus.BAD_REQUEST, "This assessment is not open for attempts");
  }

  const candidate = await AuthRepository.findById(candidateId);
  const invitation =
    candidate && (await InvitationRepository.findByAssessmentAndEmail(assessmentId, candidate.email));
  if (!invitation || invitation.status === "EXPIRED") {
    throw new ApiError(httpStatus.FORBIDDEN, "You have not been invited to this assessment");
  }

  const existing = await AttemptRepository.findActive(assessmentId, candidateId);
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, "You already have an attempt for this assessment");
  }

  if (invitation.status === "PENDING") {
    await InvitationRepository.markAccepted(invitation.id);
  }

  // The @@unique([assessmentId, candidateId]) constraint on Attempt is the
  // real guard against a double-start race — the check above is just a
  // friendlier error message for the common case.
  return AttemptRepository.create({ assessmentId, candidateId, startedAt: new Date() });
};

const getAttempt = async (id: string) => {
  const attempt = await AttemptRepository.findById(id);
  if (!attempt) {
    throw new ApiError(httpStatus.NOT_FOUND, "Attempt not found");
  }
  return resolveExpiry(attempt);
};

const heartbeat = async (id: string, event: string) => {
  const attempt = await getAttempt(id);
  if (attempt.status !== "IN_PROGRESS") {
    return attempt;
  }
  const events = Array.isArray(attempt.flaggedEvents) ? attempt.flaggedEvents : [];
  events.push({ event, at: new Date().toISOString() });
  return AttemptRepository.update(id, { flaggedEvents: events });
};

const submitAttempt = async (id: string) => {
  const attempt = await getAttempt(id);
  if (attempt.status !== "IN_PROGRESS") {
    throw new ApiError(httpStatus.BAD_REQUEST, "This attempt can no longer be submitted");
  }

  // Transaction avoids a race with a concurrent evaluation write finalizing
  // the score at the same moment this submission closes out.
  return prisma.$transaction(async (tx) => {
    const submissions = await tx.submission.findMany({ where: { attemptId: id } });
    const allEvaluated = submissions.every((s) => s.status === "EVALUATED");
    const total = submissions.reduce((sum, s) => sum + (s.manualScore ?? s.autoScore ?? 0), 0);

    return tx.attempt.update({
      where: { id },
      data: {
        submittedAt: new Date(),
        score: total,
        status: allEvaluated ? "EVALUATED" : "SUBMITTED",
      },
    });
  });
};

const myHistory = (candidateId: string) => AttemptRepository.findMyHistory(candidateId);

export const AttemptService = {
  startAttempt,
  getAttempt,
  heartbeat,
  submitAttempt,
  myHistory,
};
