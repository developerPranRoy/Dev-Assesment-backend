import httpStatus from "http-status";
import ApiError from "../../shared/ApiError";
import { CompanyRepository } from "./company.repository";
import { AuthRepository } from "../Auth/auth.repository";

const createCompany = async (ownerId: string, payload: { name: string }) => {
  const existing = await CompanyRepository.findByOwnerId(ownerId);
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, "You already own a company");
  }

  const company = await CompanyRepository.create({ name: payload.name, ownerId });

  // Owner is automatically an OWNER-level member of their own company.
  await CompanyRepository.addMember({
    companyId: company.id,
    userId: ownerId,
    permissionLevel: "OWNER",
  });

  return company;
};

const getCompany = async (id: string) => {
  const company = await CompanyRepository.findById(id);
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, "Company not found");
  }
  return company;
};

const addMember = async (
  requesterId: string,
  companyId: string,
  payload: { email: string; permissionLevel: "CREATOR" | "EVALUATOR" }
) => {
  const requesterMembership = await CompanyRepository.findMember(companyId, requesterId);
  if (!requesterMembership || requesterMembership.permissionLevel !== "OWNER") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only the company owner can add members");
  }

  const user = await AuthRepository.findByEmail(payload.email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "No user found with that email");
  }

  const existingMembership = await CompanyRepository.findMember(companyId, user.id);
  if (existingMembership) {
    throw new ApiError(httpStatus.CONFLICT, "User is already a member of this company");
  }

  return CompanyRepository.addMember({
    companyId,
    userId: user.id,
    permissionLevel: payload.permissionLevel,
  });
};

/**
 * Shared by Problems, Assessments, and Invitations: resolves which company
 * a COMPANY-role user acts for and confirms they can manage it (not just
 * evaluate). Kept here, not duplicated per module.
 */
const resolveManagerContext = async (userId: string) => {
  const membership = await CompanyRepository.findMembershipByUserId(userId);
  if (!membership) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not part of a company yet");
  }
  if (membership.permissionLevel === "EVALUATOR") {
    throw new ApiError(httpStatus.FORBIDDEN, "Evaluators cannot manage this resource");
  }
  return membership.companyId;
};

export const CompanyService = {
  createCompany,
  getCompany,
  addMember,
  resolveManagerContext,
};
