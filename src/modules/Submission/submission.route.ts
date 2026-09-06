import { Router } from "express";
import { SubmissionController } from "./submission.controller";
import { SubmissionValidation } from "./submission.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";

const router = Router();

router.post("/attempts/:attemptId/submissions", auth("CANDIDATE"), validateRequest(SubmissionValidation.submitAnswerZodSchema), SubmissionController.submitAnswer);
router.get("/attempts/:attemptId/score", auth(), SubmissionController.getScore);
router.patch("/submissions/:id/evaluate", auth("COMPANY"), validateRequest(SubmissionValidation.evaluateZodSchema), SubmissionController.evaluateSubmission);

export const SubmissionRoutes = router;
