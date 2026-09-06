import httpStatus from "http-status";
import { Role } from "@prisma/client";
import ApiError from "../../shared/ApiError";
import { CompanyRepository } from "./company.repository";
import { AuthRepository } from "../Auth/auth.repository";
import { cacheDel, cacheGetOrSet, CacheKeys, CACHE_TTL } from "../../lib/cache";

const createCompany = async (ownerId: string, payload: { name: string }) => {
  const existing = await CompanyRepository.findByOwnerId(ownerId);
  if (existing) throw new ApiError(httpStatus.CONFLICT, "You already own a company");

  const company = await CompanyRepository.create({ name: payload.name, ownerId });
  await CompanyRepository.addMember({ companyId: company.id, userId: ownerId, permissionLevel: "OWNER" });
  await cacheDel(CacheKeys.membership(ownerId), CacheKeys.member(company.id, ownerId));

  return company;
};

const getCompany = async (requesterId: string, role: Role, id: string) => {
  const company = await CompanyRepository.findById(id);
  if (!company) throw new ApiError(httpStatus.NOT_FOUND, "Company not found");

  if (role !== "ADMIN") {
    const membership = await CompanyRepository.findMember(id, requesterId);
    if (!membership) throw new ApiError(httpStatus.FORBIDDEN, "You cannot view this company");
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

  const user = await AuthRepository.findByEmail(payload.email.toLowerCase());
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "No user found with that email");
  if (user.role !== "COMPANY") throw new ApiError(httpStatus.BAD_REQUEST, "Only COMPANY users can be added as members");

  const existingMembership = await CompanyRepository.findMember(companyId, user.id);
  if (existingMembership) throw new ApiError(httpStatus.CONFLICT, "User is already a member of this company");

  const member = await CompanyRepository.addMember({ companyId, userId: user.id, permissionLevel: payload.permissionLevel });
  await cacheDel(CacheKeys.membership(user.id), CacheKeys.member(companyId, user.id));
  return member;
};

const resolveManagerContext = async (userId: string) => {
  const membership = await cacheGetOrSet(CacheKeys.membership(userId), CACHE_TTL.membership, () =>
    CompanyRepository.findMembershipByUserId(userId)
  );
  if (!membership) throw new ApiError(httpStatus.FORBIDDEN, "You are not part of a company yet");
  if (membership.permissionLevel === "EVALUATOR") {
    throw new ApiError(httpStatus.FORBIDDEN, "Evaluators cannot manage this resource");
  }
  return membership.companyId;
};

const assertCompanyMember = async (userId: string, companyId: string) => {
  const membership = await cacheGetOrSet(CacheKeys.member(companyId, userId), CACHE_TTL.member, () =>
    CompanyRepository.findMember(companyId, userId)
  );
  if (!membership) throw new ApiError(httpStatus.FORBIDDEN, "You are not a member of this company");
  return membership;
};

export const CompanyService = {
  createCompany,
  getCompany,
  addMember,
  resolveManagerContext,
  assertCompanyMember,
};
