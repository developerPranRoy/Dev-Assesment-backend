import httpStatus from "http-status";
import { PaymentProvider } from "@prisma/client";
import ApiError from "../../shared/ApiError";
import prisma from "../../shared/prisma";
import { PaymentRepository } from "./payment.repository";
import { CompanyRepository } from "../Company/company.repository";

const PRICE_PER_CREDIT = 50; // BDT — flat rate, simplest workable model

const initiatePayment = async (
  userId: string,
  payload: { credits: number; provider: PaymentProvider }
) => {
  const membership = await CompanyRepository.findMembershipByUserId(userId);
  if (!membership || membership.permissionLevel !== "OWNER") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only the company owner can purchase credits");
  }

  const amount = payload.credits * PRICE_PER_CREDIT;
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const payment = await PaymentRepository.create({
    companyId: membership.companyId,
    provider: payload.provider,
    transactionId,
    amount,
    creditsGranted: payload.credits,
  });

  // In production this returns the provider's redirect/session URL. Wiring
  // the real SSLCommerz/bKash session request is the next step once you're
  // ready to plug in live merchant credentials.
  return { payment, transactionId };
};

const handleWebhook = async (payload: { transactionId: string; status: "SUCCESS" | "FAILED" }) => {
  const payment = await PaymentRepository.findByTransactionId(payload.transactionId);
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Unknown transaction");
  }

  // Idempotency: a webhook that arrives twice for the same transaction must
  // not double-grant credits.
  if (payment.status !== "PENDING") {
    return payment;
  }

  if (payload.status === "FAILED") {
    return PaymentRepository.markFailed(payment.id);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "COMPLETED" },
    });
    await tx.company.update({
      where: { id: payment.companyId },
      data: { credits: { increment: payment.creditsGranted ?? 0 } },
    });
    await tx.auditLog.create({
      data: {
        action: "payment.completed",
        entityType: "Payment",
        entityId: payment.id,
        metadata: { credits: payment.creditsGranted },
      },
    });
    return updated;
  });
};

const getPayment = async (id: string) => {
  const payment = await PaymentRepository.findById(id);
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
  }
  return payment;
};

export const PaymentService = {
  initiatePayment,
  handleWebhook,
  getPayment,
};
