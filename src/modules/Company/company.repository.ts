import prisma from "../../shared/prisma";
import { PermissionLevel } from "@prisma/client";

const create = (data: { name: string; ownerId: string }) =>
  prisma.company.create({ data });

const findById = (id: string) =>
  prisma.company.findFirst({
    where: { id, deletedAt: null },
    include: { members: { select: { userId: true, permissionLevel: true } } },
  });

const findByOwnerId = (ownerId: string) =>
  prisma.company.findFirst({ where: { ownerId, deletedAt: null } });

const findMembershipByUserId = (userId: string) =>
  prisma.companyMember.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });

const findMember = (companyId: string, userId: string) =>
  prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId, userId } },
  });

const addMember = (data: { companyId: string; userId: string; permissionLevel: PermissionLevel }) =>
  prisma.companyMember.create({ data });

export const CompanyRepository = {
  create,
  findById,
  findByOwnerId,
  findMembershipByUserId,
  findMember,
  addMember,
};
