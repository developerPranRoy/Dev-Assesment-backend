import httpStatus from "http-status";
import Stripe from "stripe";
import ApiError from "../../shared/ApiError";
import prisma from "../../shared/prisma";
import config from "../../config";
import stripe from "../../lib/stripe";
import { PaymentRepository } from "./payment.repository";
import { CompanyRepository } from "../Company/company.repository";

const PRICE_PER_CREDIT_CENTS = 50; // $0.50 per credit (USD)

const initiatePayment = async (userId: string, payload: { credits: number }) => {
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

/**
 * rawBody must be the untouched request body (Buffer) — Stripe's signature
 * check fails against anything that's been JSON-parsed and re-serialized.
 */
const handleStripeWebhook = async (rawBody: Buffer, signature: string) => {
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Stripe webhook signature");
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const payment = await PaymentRepository.findByTransactionId(session.id);
    if (payment && payment.status === "PENDING") {
      await PaymentRepository.markFailed(payment.id);
    }
    return { received: true };
  }

  if (event.type !== "checkout.session.completed") {
    return { received: true }; // acknowledge — nothing to do for other event types
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const payment = await PaymentRepository.findByTransactionId(session.id);
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Unknown transaction");
  }

  // Idempotency: Stripe retries webhook delivery — a second event for an
  // already-processed session must not double-grant credits.
  if (payment.status !== "PENDING") {
    return { received: true };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.payment.update({
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
    return result;
  });

  return updated;
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
  handleStripeWebhook,
  getPayment,
};