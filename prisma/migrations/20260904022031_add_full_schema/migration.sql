-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CANDIDATE', 'COMPANY', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "PermissionLevel" AS ENUM ('OWNER', 'CREATOR', 'EVALUATOR');

-- CreateEnum
CREATE TYPE "ProblemType" AS ENUM ('CODING', 'MCQ', 'WRITTEN');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'EVALUATED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'EVALUATED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('SSLCOMMERZ', 'BKASH', 'STRIPE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "googleId" TEXT,
    "role" "Role" NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeUrl" TEXT,
    "skills" TEXT[],
    "experienceLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMember" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionLevel" "PermissionLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "ProblemType" NOT NULL,
    "title" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "tags" TEXT[],
    "points" INTEGER NOT NULL DEFAULT 0,
    "testCases" JSONB,
    "options" JSONB,
    "correctAnswer" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "durationMinutes" INTEGER NOT NULL,
    "passingScore" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentProblem" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,

    CONSTRAINT "AssessmentProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "candidateEmail" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "score" INTEGER,
    "flaggedEvents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "autoScore" INTEGER,
    "manualScore" INTEGER,
    "evaluatedById" TEXT,
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "creditsGranted" INTEGER,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");

-- CreateIndex
CREATE INDEX "Company_ownerId_idx" ON "Company"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMember_companyId_userId_key" ON "CompanyMember"("companyId", "userId");

-- CreateIndex
CREATE INDEX "Problem_companyId_type_difficulty_idx" ON "Problem"("companyId", "type", "difficulty");

-- CreateIndex
CREATE INDEX "Assessment_companyId_status_idx" ON "Assessment"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentProblem_assessmentId_problemId_key" ON "AssessmentProblem"("assessmentId", "problemId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_assessmentId_status_idx" ON "Invitation"("assessmentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Attempt_assessmentId_candidateId_key" ON "Attempt"("assessmentId", "candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_attemptId_problemId_key" ON "Submission"("attemptId", "problemId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_companyId_status_idx" ON "Payment"("companyId", "status");

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentProblem" ADD CONSTRAINT "AssessmentProblem_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentProblem" ADD CONSTRAINT "AssessmentProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_evaluatedById_fkey" FOREIGN KEY ("evaluatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
