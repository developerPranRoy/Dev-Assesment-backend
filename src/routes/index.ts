import { Router } from "express";
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

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/companies", route: CompanyRoutes },
  { path: "/problems", route: ProblemRoutes },
  { path: "/assessments", route: AssessmentRoutes },
  // Invitation, Attempt, and Submission define their own full paths
  // (spanning /assessments, /attempts, /invitations, /submissions),
  // so they mount at root rather than under a single prefix.
  { path: "/", route: InvitationRoutes },
  { path: "/", route: AttemptRoutes },
  { path: "/", route: SubmissionRoutes },
  { path: "/payments", route: PaymentRoutes },
  { path: "/admin", route: AdminRoutes },
];

moduleRoutes.forEach(({ path, route }) => router.use(path, route));

export default router;
