import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { InvitationService } from "./invitation.service";

const inviteCandidates = catchAsync(async (req: Request, res: Response) => {
  const data = await InvitationService.inviteCandidates(
    req.user!.id,
    req.params.assessmentId,
    req.body.emails
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Invitations sent successfully",
    data,
  });
});

const listInvitations = catchAsync(async (req: Request, res: Response) => {
  const data = await InvitationService.listInvitations(req.user!.id, req.params.assessmentId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Invitations retrieved successfully",
    data,
  });
});

const acceptInvitation = catchAsync(async (req: Request, res: Response) => {
  const data = await InvitationService.acceptInvitation(req.params.token);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Invitation accepted successfully",
    data,
  });
});

export const InvitationController = {
  inviteCandidates,
  listInvitations,
  acceptInvitation,
};
