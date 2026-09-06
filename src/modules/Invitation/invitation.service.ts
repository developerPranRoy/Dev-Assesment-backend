import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import ApiError from "../../shared/ApiError";
import prisma from "../../shared/prisma";
import config from "../../config";
import { InvitationRepository } from "./invitation.repository";
import { AssessmentRepository } from "../Assessment/assessment.repository";
import { CompanyService } from "../Company/company.service";
import { AuthRepository } from "../Auth/auth.repository";
import { CompanyRepository } from "../Company/company.repository";
import { sendMail } from "../../lib/mailer";
import { buildInvitationEmail } from "../../lib/emailTemplates";

const DEFAULT_EXPIRY_DAYS = 7;

const assertOwnsAssessment = async (userId: string, assessmentId: string) => {
  const assessment = await AssessmentRepository.findById(assessmentId);
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  const companyId = await CompanyService.resolveManagerContext(userId);
  if (assessment.companyId !== companyId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You cannot invite candidates to this assessment");
  }
  if (assessment.status !== "PUBLISHED") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Only published assessments can be invited to");
  }
  return assessment;
};

const inviteCandidates = async (userId: string, assessmentId: string, emails: string[]) => {
  const assessment = await assertOwnsAssessment(userId, assessmentId);
  const uniqueEmails = [...new Set(emails.map((email) => email.toLowerCase()))];
  const creditCost = uniqueEmails.length * config.credits.perInvitation;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_EXPIRY_DAYS);

  let invitations;

  try {
    invitations = await prisma.$transaction(async (tx) => {
      const consumed = await tx.company.updateMany({
        where: { id: assessment.companyId, deletedAt: null, credits: { gte: creditCost } },
        data: { credits: { decrement: creditCost } },
      });

      if (consumed.count === 0) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Insufficient credits — ${creditCost} required to send these invitations`
        );
      }

      return Promise.all(
        uniqueEmails.map((candidateEmail) =>
          InvitationRepository.create({ assessmentId, candidateEmail, expiresAt }, tx)
        )
      );
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ApiError(
        httpStatus.CONFLICT,
        "One or more candidates have already been invited to this assessment"
      );
    }
    throw err;
  }

  const company = await CompanyRepository.findById(assessment.companyId);
  const companyName = company?.name ?? "A company";

  for (const invitation of invitations) {
    const { subject, html } = buildInvitationEmail({
      candidateEmail: invitation.candidateEmail,
      assessmentTitle: assessment.title,
      companyName,
      invitationToken: invitation.token,
      expiresAt: invitation.expiresAt,
    });

    sendMail({ to: invitation.candidateEmail, subject, html });
  }

  return invitations;
};

const listInvitations = async (userId: string, assessmentId: string) => {
  await assertOwnsAssessment(userId, assessmentId);
  return InvitationRepository.findMany(assessmentId);
};

const acceptInvitation = async (userId: string, token: string) => {
  const invitation = await InvitationRepository.findByToken(token);
  if (!invitation) throw new ApiError(httpStatus.NOT_FOUND, "Invitation not found");
  if (invitation.status !== "PENDING") throw new ApiError(httpStatus.BAD_REQUEST, "This invitation is no longer valid");
  if (invitation.expiresAt < new Date()) throw new ApiError(httpStatus.BAD_REQUEST, "This invitation has expired");

  const candidate = await AuthRepository.findById(userId);
  if (!candidate || candidate.email.toLowerCase() !== invitation.candidateEmail.toLowerCase()) {
    throw new ApiError(httpStatus.FORBIDDEN, "This invitation was not issued to your account");
  }

  return InvitationRepository.markAccepted(invitation.id);
};

export const InvitationService = { inviteCandidates, listInvitations, acceptInvitation };
