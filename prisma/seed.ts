import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@platform.dev" },
    update: {},
    create: {
      name: "Platform Admin",
      email: "admin@platform.dev",
      passwordHash,
      provider: "LOCAL",
      role: "ADMIN",
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@acme.dev" },
    update: {},
    create: {
      name: "Acme Owner",
      email: "owner@acme.dev",
      passwordHash,
      provider: "LOCAL",
      role: "COMPANY",
    },
  });

  const evaluator = await prisma.user.upsert({
    where: { email: "evaluator@acme.dev" },
    update: {},
    create: {
      name: "Acme Evaluator",
      email: "evaluator@acme.dev",
      passwordHash,
      provider: "LOCAL",
      role: "COMPANY",
    },
  });

  const candidate = await prisma.user.upsert({
    where: { email: "candidate@example.dev" },
    update: {},
    create: {
      name: "Sample Candidate",
      email: "candidate@example.dev",
      passwordHash,
      provider: "LOCAL",
      role: "CANDIDATE",
    },
  });

  const company = await prisma.company.upsert({
    where: { id: "seed-company-acme" },
    update: {},
    create: {
      id: "seed-company-acme",
      name: "Acme Inc",
      ownerId: owner.id,
      credits: 10,
    },
  });

  await prisma.companyMember.upsert({
    where: { companyId_userId: { companyId: company.id, userId: owner.id } },
    update: {},
    create: { companyId: company.id, userId: owner.id, permissionLevel: "OWNER" },
  });

  await prisma.companyMember.upsert({
    where: { companyId_userId: { companyId: company.id, userId: evaluator.id } },
    update: {},
    create: { companyId: company.id, userId: evaluator.id, permissionLevel: "EVALUATOR" },
  });

  await prisma.problem.upsert({
    where: { id: "seed-problem-mcq" },
    update: {},
    create: {
      id: "seed-problem-mcq",
      companyId: company.id,
      type: "MCQ",
      title: "What does REST stand for?",
      statement: "Choose the correct expansion of REST.",
      difficulty: "EASY",
      tags: ["fundamentals"],
      points: 10,
      options: [
        "Representational State Transfer",
        "Remote Execution Service Tool",
        "Rapid Endpoint Testing",
      ],
      correctAnswer: "Representational State Transfer",
      createdById: owner.id,
    },
  });

  console.log({
    admin: admin.email,
    owner: owner.email,
    evaluator: evaluator.email,
    candidate: candidate.email,
    company: company.name,
    password: "Password123! (for all seeded accounts)",
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
