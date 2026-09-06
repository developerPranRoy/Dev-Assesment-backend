-- Performance indexes for million-user scale
-- These are additive (IF NOT EXISTS) and safe to run on live data.

-- AuditLog: most queries filter by actor + time range
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_createdAt_idx"
  ON "AuditLog"("actorId", "createdAt" DESC);

-- Invitation: token lookup is the hot path for candidate flows
CREATE INDEX IF NOT EXISTS "Invitation_token_idx"
  ON "Invitation"("token");

-- Invitation: find-by-email scans are frequent in attempt.start
CREATE INDEX IF NOT EXISTS "Invitation_candidateEmail_status_idx"
  ON "Invitation"("candidateEmail", "status");

-- Assessment: list by company is the primary company-facing query
CREATE INDEX IF NOT EXISTS "Assessment_companyId_status_createdAt_idx"
  ON "Assessment"("companyId", "status", "createdAt" DESC)
  WHERE "deletedAt" IS NULL;

-- Problem: list with type+difficulty filter
CREATE INDEX IF NOT EXISTS "Problem_companyId_type_difficulty_idx"
  ON "Problem"("companyId", "type", "difficulty")
  WHERE "deletedAt" IS NULL;

-- Payment: company billing history
CREATE INDEX IF NOT EXISTS "Payment_companyId_createdAt_idx"
  ON "Payment"("companyId", "createdAt" DESC);

-- User: soft-delete aware role lookup (admin panel)
CREATE INDEX IF NOT EXISTS "User_role_createdAt_idx"
  ON "User"("role", "createdAt" DESC)
  WHERE "deletedAt" IS NULL;
