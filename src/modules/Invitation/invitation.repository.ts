import crypto from "crypto";
import prisma from "../../shared/prisma";
import { Prisma } from "@prisma/client";

const create = (
  data: { assessmentId: string; candidateEmail: string; expiresAt: Date },
  tx: Prisma.TransactionClient | typeof prisma = prisma
) =>
  tx.invitation.create({
    data: {
      ...data,
      candidateEmail: data.candidateEmail.toLowerCase(),
      token: crypto.randomBytes(24).toString("hex"),
    },
  });

const findMany = (assessmentId: string) =>
  prisma.invitation.findMany({ where: { assessmentId }, orderBy: { createdAt: "desc" } });

const findByToken = (token: string) =>
  prisma.invitation.findUnique({ where: { token } });

const findByAssessmentAndEmail = (assessmentId: string, candidateEmail: string) =>
  prisma.invitation.findFirst({
    where: { assessmentId, candidateEmail: candidateEmail.toLowerCase() },
  });

const markAccepted = (id: string, tx: Prisma.TransactionClient | typeof prisma = prisma) =>
  tx.invitation.update({ where: { id }, data: { status: "ACCEPTED" } });

export const InvitationRepository = {
  create,
  findMany,
  findByToken,
  findByAssessmentAndEmail,
  markAccepted,
};
