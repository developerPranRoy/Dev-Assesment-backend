import { Router } from "express";
import { ProblemController } from "./problem.controller";
import { ProblemValidation } from "./problem.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";

const router = Router();

router.post("/", auth("COMPANY"), validateRequest(ProblemValidation.createProblemZodSchema), ProblemController.createProblem);
router.get("/", auth("COMPANY"), ProblemController.listProblems);
router.get("/search", auth("COMPANY"), ProblemController.searchProblems);
router.get("/:id", auth("COMPANY"), ProblemController.getProblem);
router.patch("/:id", auth("COMPANY"), validateRequest(ProblemValidation.updateProblemZodSchema), ProblemController.updateProblem);
router.delete("/:id", auth("COMPANY"), ProblemController.deleteProblem);

export const ProblemRoutes = router;
