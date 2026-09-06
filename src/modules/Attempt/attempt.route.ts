import { Router } from "express";
import { AttemptController } from "./attempt.controller";
import { AttemptValidation } from "./attempt.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";

const router = Router();

router.post("/assessments/:assessmentId/attempts/start", auth("CANDIDATE"), AttemptController.startAttempt);
router.get("/attempts/my-history", auth("CANDIDATE"), AttemptController.myHistory);
router.get("/attempts/:id", auth(), AttemptController.getAttempt);
router.patch("/attempts/:id/heartbeat", auth("CANDIDATE"), validateRequest(AttemptValidation.heartbeatZodSchema), AttemptController.heartbeat);
router.post("/attempts/:id/submit", auth("CANDIDATE"), AttemptController.submitAttempt);

export const AttemptRoutes = router;
