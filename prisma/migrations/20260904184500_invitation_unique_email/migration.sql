-- Prevent duplicate invites for the same candidate on one assessment
DELETE FROM "Invitation" a
USING "Invitation" b
WHERE a."assessmentId" = b."assessmentId"
  AND a."candidateEmail" = b."candidateEmail"
  AND a."createdAt" < b."createdAt";

CREATE UNIQUE INDEX "Invitation_assessmentId_candidateEmail_key" ON "Invitation"("assessmentId", "candidateEmail");
