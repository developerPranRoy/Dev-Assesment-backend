import express, { Router } from "express";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";

const router = Router();

router.post("/initiate", auth("COMPANY"), validateRequest(PaymentValidation.initiateZodSchema), PaymentController.initiatePayment);
router.post("/webhook", express.raw({ type: "application/json" }), PaymentController.webhook);
router.get("/:id", auth("COMPANY"), PaymentController.getPayment);

export const PaymentRoutes = router;
