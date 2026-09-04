import { Router } from "express";
import { CompanyController } from "./company.controller";
import { CompanyValidation } from "./company.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";

const router = Router();

router.post(
  "/",
  auth("COMPANY"),
  validateRequest(CompanyValidation.createCompanyZodSchema),
  CompanyController.createCompany
);

router.get("/:id", CompanyController.getCompany);

router.post(
  "/:id/members",
  auth("COMPANY"),
  validateRequest(CompanyValidation.addMemberZodSchema),
  CompanyController.addMember
);

export const CompanyRoutes = router;
