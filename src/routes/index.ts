import { Router } from "express";
import config from "../config";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { CompanyRoutes } from "../modules/Company/company.route";
import { ProblemRoutes } from "../modules/Problem/problem.route";
import { AssessmentRoutes } from "../modules/Assessment/assessment.route";
import { InvitationRoutes } from "../modules/Invitation/invitation.route";
import { AttemptRoutes } from "../modules/Attempt/attempt.route";
import { SubmissionRoutes } from "../modules/Submission/submission.route";
import { PaymentRoutes } from "../modules/Payment/payment.route";
import { AdminRoutes } from "../modules/Admin/admin.route";

const router = Router();
const service = config.serviceName;

if (service === "all" || service === "auth") {
  router.use("/auth", AuthRoutes);
}

if (service === "all" || service === "core") {
  router.use("/companies", CompanyRoutes);
  router.use("/problems", ProblemRoutes);
  router.use("/assessments", AssessmentRoutes);
  router.use("/", InvitationRoutes);
  router.use("/admin", AdminRoutes);
}

if (service === "all" || service === "exam") {
  router.use("/", AttemptRoutes);
  router.use("/", SubmissionRoutes);
}

if (service === "all" || service === "payment") {
  router.use("/payments", PaymentRoutes);
}

export default router;
