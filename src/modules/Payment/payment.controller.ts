import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { requireUser } from "../../middlewares/auth";
import { PaymentService } from "./payment.service";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await PaymentService.initiatePayment(user.id, req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: "Payment session created successfully", data });
});

const webhook = catchAsync(async (req: Request, res: Response) => {
  const signature = (req.headers["stripe-signature"] as string | undefined) ?? "";
  const data = await PaymentService.handleStripeWebhook(req.body as Buffer, signature);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Webhook processed successfully", data });
});

const getPayment = catchAsync(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const data = await PaymentService.getPayment(user.id, user.role, req.params["id"] ?? "");
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: "Payment retrieved successfully", data });
});

export const PaymentController = { initiatePayment, webhook, getPayment };
