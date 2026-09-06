import httpStatus from "http-status";
import { Prisma, Role } from "@prisma/client";
import ApiError from "../../shared/ApiError";
import prisma from "../../shared/prisma";
import { AttemptRepository } from "./attempt.repository";
import { AssessmentRepository } from "../Assessment/assessment.repository";
import { InvitationRepository } from "../Invitation/invitation.repository";
import { AuthRepository } from "../Auth/auth.repository";
import { CompanyRepository } from "../Company/company.repository";

type AttemptWithAssessment = NonNullable<Awaited<ReturnType<typeof AttemptRepository.findById>>>;

const resolveExpiry = async (attempt: AttemptWithAssessment) => {
  if (attempt.status !== "IN_PROGRESS" || !attempt.startedAt) return attempt;
  const deadline = new Date(attempt.startedAt.getTime() + attempt.assessment.durationMinutes * 60_000);
  if (new Date() <= deadline) return attempt;
  return prisma.attempt.update({
    where: { id: attempt.id },
    data: { status: "EXPIRED" },
    include: { assessment: true },
  });
};

const assertCanAccessAttempt = async (
  userId: string,
  role: Role,
  attempt: AttemptWithAssessment,
  asOwnerOnly = false
) => {
  if (attempt.candidateId === userId) return;
  if (asOwnerOnly) throw new ApiError(httpStatus.FORBIDDEN, "You cannot modify this attempt");
  if (role === "ADMIN") return;
  if (role === "COMPANY") {
    const membership = await CompanyRepository.findMember(attempt.assessment.companyId, userId);
    if (membership) return;
  }
  throw new ApiError(httpStatus.FORBIDDEN, "You cannot view this attempt");
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
  if (existing) throw new ApiError(httpStatus.CONFLICT, "You already have an attempt for this assessment");

  try {
    return await prisma.$transaction(async (tx) => {
      if (invitation.status === "PENDING") {
        await InvitationRepository.markAccepted(invitation.id, tx);
      }
      return tx.attempt.create({
        data: { assessmentId, candidateId, startedAt: new Date(), status: "IN_PROGRESS" },
      });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ApiError(httpStatus.CONFLICT, "You already have an attempt for this assessment");
    }
    throw err;
  }
};

const getAttempt = async (userId: string, role: Role, id: string) => {
  const attempt = await AttemptRepository.findById(id);
  if (!attempt) throw new ApiError(httpStatus.NOT_FOUND, "Attempt not found");
  const resolved = await resolveExpiry(attempt);
  await assertCanAccessAttempt(userId, role, resolved);
  return resolved;
};

const heartbeat = async (userId: string, id: string, event: string) => {
  const attempt = await AttemptRepository.findById(id);
  if (!attempt) throw new ApiError(httpStatus.NOT_FOUND, "Attempt not found");
  const resolved = await resolveExpiry(attempt);
  await assertCanAccessAttempt(userId, "CANDIDATE", resolved, true);
  if (resolved.status !== "IN_PROGRESS") return resolved;
  const events = Array.isArray(resolved.flaggedEvents) ? [...resolved.flaggedEvents] : [];
  events.push({ event, at: new Date().toISOString() });
  return AttemptRepository.update(id, { flaggedEvents: events.slice(-100) });
};

const submitAttempt = async (userId: string, id: string) => {
  const attempt = await AttemptRepository.findById(id);
  if (!attempt) throw new ApiError(httpStatus.NOT_FOUND, "Attempt not found");
  const resolved = await resolveExpiry(attempt);
  await assertCanAccessAttempt(userId, "CANDIDATE", resolved, true);
  if (resolved.status !== "IN_PROGRESS") throw new ApiError(httpStatus.BAD_REQUEST, "This attempt can no longer be submitted");

  return prisma.$transaction(async (tx) => {
    const submissions = await tx.submission.findMany({ where: { attemptId: id } });
    const allEvaluated = submissions.every((s) => s.status === "EVALUATED");
    const total = submissions.reduce((sum, s) => sum + (s.manualScore ?? s.autoScore ?? 0), 0);
    return tx.attempt.update({
      where: { id },
      data: { submittedAt: new Date(), score: total, status: allEvaluated ? "EVALUATED" : "SUBMITTED" },
    });
  });
};

const myHistory = (candidateId: string) => AttemptRepository.findMyHistory(candidateId);

export const AttemptService = { startAttempt, getAttempt, heartbeat, submitAttempt, myHistory };
