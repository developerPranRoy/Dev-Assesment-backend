import { Router } from "express";
import { AssessmentController } from "./assessment.controller";
import { AssessmentValidation } from "./assessment.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";

const router = Router();

router.post("/", auth("COMPANY"), validateRequest(AssessmentValidation.createAssessmentZodSchema), AssessmentController.createAssessment);
router.get("/", auth("COMPANY"), AssessmentController.listAssessments);
router.get("/:id", auth(), AssessmentController.getAssessment);
router.patch("/:id", auth("COMPANY"), validateRequest(AssessmentValidation.updateAssessmentZodSchema), AssessmentController.updateAssessment);
router.delete("/:id", auth("COMPANY"), AssessmentController.deleteAssessment);
router.post("/:id/problems", auth("COMPANY"), validateRequest(AssessmentValidation.addProblemZodSchema), AssessmentController.addProblem);
router.patch("/:id/status", auth("COMPANY"), validateRequest(AssessmentValidation.changeStatusZodSchema), AssessmentController.changeStatus);

export const AssessmentRoutes = router;
