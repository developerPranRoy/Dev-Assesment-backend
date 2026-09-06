import { Worker, Job } from "bullmq";
import config from "./config";
import prisma from "./shared/prisma";
import { connectRedis, disconnectRedis } from "./lib/redis";
import { GRADING_QUEUE, GradingJob, getBullConnection } from "./lib/queue";
import { Judge0Client } from "./lib/judge0";
import logger from "./shared/logger";

const gradeSubmission = async (job: GradingJob) => {
  logger.info({ submissionId: job.submissionId }, "grading_started");

  const results = await Judge0Client.runTestCases(job.code, job.languageId, job.testCases);
  const passedCount = results.filter((r) => r.passed).length;
  const autoScore = job.testCases.length
    ? Math.round((passedCount / job.testCases.length) * job.points)
    : 0;

  await prisma.$transaction(async (tx) => {
    const updated = await tx.submission.update({
      where: { id: job.submissionId },
      data: { status: "EVALUATED", autoScore },
    });

    const submissions = await tx.submission.findMany({
      where: { attemptId: updated.attemptId },
    });

    const allEvaluated = submissions.every((s) => s.status === "EVALUATED");
    const total = submissions.reduce((sum, s) => sum + (s.manualScore ?? s.autoScore ?? 0), 0);

    await tx.attempt.update({
      where: { id: updated.attemptId },
      data: { score: total, ...(allEvaluated ? { status: "EVALUATED" } : {}) },
    });
  });

  logger.info(
    { submissionId: job.submissionId, autoScore, passedCount, total: job.testCases.length },
    "grading_complete"
  );
};

const bootstrap = async () => {
  if (config.env === "production" && !config.judge0.apiUrl) {
    logger.warn({}, "JUDGE0_API_URL not set — coding jobs will fail");
  }

  await connectRedis();

  const concurrency = Number(process.env.WORKER_CONCURRENCY) || 8;

  const worker = new Worker<GradingJob>(
    GRADING_QUEUE,
    async (job: Job<GradingJob>) => {
      await gradeSubmission(job.data);
    },
    {
      connection: getBullConnection(),
      concurrency,
      stalledInterval: 30_000,
      maxStalledCount: 2,
    }
  );

  worker.on("failed", (job, err: Error) => {
    logger.error({ jobId: job?.id, submissionId: job?.data?.submissionId, err }, "grading_job_failed");
  });

  worker.on("error", (err: Error) => {
    logger.error({ err }, "grading_worker_error");
  });

  logger.info({ concurrency }, "grading_worker_started");

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "worker_shutdown_initiated");
    await worker.close();
    await disconnectRedis();
    await prisma.$disconnect();
    logger.info({ signal }, "worker_shutdown_complete");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (err) => {
    logger.error({ err }, "worker_unhandled_rejection");
    process.exit(1);
  });
};

bootstrap().catch((err) => {
  logger.error({ err }, "worker_bootstrap_failed");
  process.exit(1);
});
