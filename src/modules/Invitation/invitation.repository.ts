import crypto from "crypto";
import prisma from "../../shared/prisma";

const create = (data: { assessmentId: string; candidateEmail: string; expiresAt: Date }) =>
  prisma.invitation.create({
    data: { ...data, token: crypto.randomBytes(24).toString("hex") },
  });

const findMany = (assessmentId: string) =>
  prisma.invitation.findMany({ where: { assessmentId }, orderBy: { createdAt: "desc" } });

const findByToken = (token: string) => prisma.invitation.findUnique({ where: { token } });

const findByAssessmentAndEmail = (assessmentId: string, candidateEmail: string) =>
  prisma.invitation.findFirst({ where: { assessmentId, candidateEmail } });

const markAccepted = (id: string) =>
  prisma.invitation.update({ where: { id }, data: { status: "ACCEPTED" } });

export const InvitationRepository = {
  create,
  findMany,
  findByToken,
  findByAssessmentAndEmail,
  markAccepted,
};
