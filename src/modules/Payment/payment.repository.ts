import prisma from "../../shared/prisma";
import { PaymentProvider } from "@prisma/client";

const create = (data: {
  companyId: string;
  provider: PaymentProvider;
  transactionId: string;
  amount: number;
  creditsGranted: number;
}) => prisma.payment.create({ data });

const findByTransactionId = (transactionId: string) =>
  prisma.payment.findUnique({ where: { transactionId } });

const findById = (id: string) =>
  prisma.payment.findUnique({ where: { id } });

const markFailed = (id: string) =>
  prisma.payment.update({ where: { id }, data: { status: "FAILED" } });

export const PaymentRepository = { create, findByTransactionId, findById, markFailed };
