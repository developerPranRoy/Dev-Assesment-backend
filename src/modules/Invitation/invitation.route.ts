import { Router } from "express";
import { InvitationController } from "./invitation.controller";
import { InvitationValidation } from "./invitation.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";

const router = Router();

router.post(
  "/assessments/:assessmentId/invitations",
  auth("COMPANY"),
  validateRequest(InvitationValidation.inviteZodSchema),
  InvitationController.inviteCandidates
);

router.get(
  "/assessments/:assessmentId/invitations",
  auth("COMPANY"),
  InvitationController.listInvitations
);

router.post("/invitations/:token/accept", auth("CANDIDATE"), InvitationController.acceptInvitation);

export const InvitationRoutes = router;
