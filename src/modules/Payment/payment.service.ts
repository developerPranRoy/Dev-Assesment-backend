import httpStatus from "http-status";
import Stripe from "stripe";
import { Role } from "@prisma/client";
import ApiError from "../../shared/ApiError";
import prisma from "../../shared/prisma";
import config from "../../config";
import stripe from "../../lib/stripe";
import { PaymentRepository } from "./payment.repository";
import { CompanyRepository } from "../Company/company.repository";

const PRICE_PER_CREDIT_CENTS = 50;

const initiatePayment = async (userId: string, payload: { credits: number }) => {
  if (!config.stripe.secretKey) {
    throw new ApiError(httpStatus.NOT_IMPLEMENTED, "Stripe is not configured");
  }

  const membership = await CompanyRepository.findMembershipByUserId(userId);
  if (!membership || membership.permissionLevel !== "OWNER") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only the company owner can purchase credits");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `${payload.credits} assessment credit(s)` },
          unit_amount: PRICE_PER_CREDIT_CENTS,
        },
        quantity: payload.credits,
      },
    ],
    success_url: config.stripe.successUrl,
    cancel_url: config.stripe.cancelUrl,
    metadata: { companyId: membership.companyId, credits: String(payload.credits) },
  });

  const payment = await PaymentRepository.create({
    companyId: membership.companyId,
    provider: "STRIPE",
    transactionId: session.id,
    amount: (payload.credits * PRICE_PER_CREDIT_CENTS) / 100,
    creditsGranted: payload.credits,
  });

  return { payment, checkoutUrl: session.url };
};

const handleStripeWebhook = async (rawBody: Buffer, signature: string) => {
  if (!signature) throw new ApiError(httpStatus.BAD_REQUEST, "Missing Stripe signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Stripe webhook signature");
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await prisma.payment.updateMany({
      where: { transactionId: session.id, status: "PENDING" },
      data: { status: "FAILED" },
    });
    return { received: true };
  }

  if (event.type !== "checkout.session.completed") return { received: true };

  const session = event.data.object as Stripe.Checkout.Session;
  const payment = await PaymentRepository.findByTransactionId(session.id);
  if (!payment || payment.status !== "PENDING") return { received: true };

  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "COMPLETED" },
    });
    if (claimed.count === 0) return null;
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
    return tx.payment.findUnique({ where: { id: payment.id } });
  });

  return updated ?? { received: true };
};

const getPayment = async (userId: string, role: Role, id: string) => {
  const payment = await PaymentRepository.findById(id);
  if (!payment) throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");

  if (role !== "ADMIN") {
    const membership = await CompanyRepository.findMember(payment.companyId, userId);
    if (!membership) throw new ApiError(httpStatus.FORBIDDEN, "You cannot view this payment");
  }

  return payment;
};

export const PaymentService = { initiatePayment, handleStripeWebhook, getPayment };
