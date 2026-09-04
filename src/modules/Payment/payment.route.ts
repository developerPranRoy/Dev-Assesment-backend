import express, { Router } from "express";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";

const router = Router();

router.post(
  "/initiate",
  auth("COMPANY"),
  validateRequest(PaymentValidation.initiateZodSchema),
  PaymentController.initiatePayment
);

// Stripe verifies its signature against the exact raw bytes, so this route
// gets its own raw-body parser instead of the global JSON one — see the
// matching exclusion in app.ts. No Zod validation here: the body isn't
// parsed JSON at this point, and signature verification is the real check.
router.post("/webhook", express.raw({ type: "application/json" }), PaymentController.webhook);

router.get("/:id", auth("COMPANY"), PaymentController.getPayment);

export const PaymentRoutes = router;