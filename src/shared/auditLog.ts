import prisma from "./prisma";

export const logAudit = (data: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) => prisma.auditLog.create({ data });
