import httpStatus from "http-status";
import ApiError from "../../shared/ApiError";
import { InvitationRepository } from "./invitation.repository";
import { AssessmentRepository } from "../Assessment/assessment.repository";
import { CompanyService } from "../Company/company.service";

const DEFAULT_EXPIRY_DAYS = 7;

const assertOwnsAssessment = async (userId: string, assessmentId: string) => {
  const assessment = await AssessmentRepository.findById(assessmentId);
  if (!assessment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  }

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
  await assertOwnsAssessment(userId, assessmentId);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_EXPIRY_DAYS);

  return Promise.all(
    emails.map((candidateEmail) =>
      InvitationRepository.create({ assessmentId, candidateEmail, expiresAt })
    )
  );
};

const listInvitations = async (userId: string, assessmentId: string) => {
  await assertOwnsAssessment(userId, assessmentId);
  return InvitationRepository.findMany(assessmentId);
};

const acceptInvitation = async (token: string) => {
  const invitation = await InvitationRepository.findByToken(token);
  if (!invitation) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invitation not found");
  }
  if (invitation.status !== "PENDING") {
    throw new ApiError(httpStatus.BAD_REQUEST, "This invitation is no longer valid");
  }
  if (invitation.expiresAt < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "This invitation has expired");
  }
  return InvitationRepository.markAccepted(invitation.id);
};

export const InvitationService = {
  inviteCandidates,
  listInvitations,
  acceptInvitation,
};
