import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import logger from "./logger";

export const logAudit = (data: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}): void => {
  const input: Prisma.AuditLogUncheckedCreateInput = {
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    actorId: data.actorId,
    metadata: data.metadata as Prisma.InputJsonValue | undefined,
  };

  prisma.auditLog.create({ data: input }).catch((err: unknown) => {
    logger.error({ err, data }, "audit_log_write_failed");
  });
};
