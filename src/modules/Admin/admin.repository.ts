import prisma from "../../shared/prisma";
import { Role } from "@prisma/client";

const findUsers = (params: { skip: number; take: number; role?: Role }) => {
  const where = { deletedAt: null, ...(params.role && { role: params.role }) };
  return Promise.all([
    prisma.user.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);
};

const updateRole = (id: string, role: Role) =>
  prisma.user.update({ where: { id }, data: { role } });

const dashboardStats = async () => {
  const [totalUsers, totalCompanies, totalAssessments, totalAttempts, completedPayments] =
    await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.company.count({ where: { deletedAt: null } }),
      prisma.assessment.count({ where: { deletedAt: null } }),
      prisma.attempt.count(),
      prisma.payment.count({ where: { status: "COMPLETED" } }),
    ]);
  return { totalUsers, totalCompanies, totalAssessments, totalAttempts, completedPayments };
};

const findAuditLogs = (params: { skip: number; take: number }) =>
  Promise.all([
    prisma.auditLog.findMany({
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count(),
  ]);

export const AdminRepository = {
  findUsers,
  updateRole,
  dashboardStats,
  findAuditLogs,
};
