-- CreateIndex
CREATE INDEX IF NOT EXISTS "Attempt_candidateId_status_idx" ON "Attempt"("candidateId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Submission_attemptId_status_idx" ON "Submission"("attemptId", "status");
