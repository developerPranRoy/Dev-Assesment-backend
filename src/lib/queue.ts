import { Queue } from "bullmq";
import IORedis from "ioredis";
import config from "../config";

export const GRADING_QUEUE = "grading";

export type GradingJob = {
  submissionId: string;
  code: string;
  languageId: number;
  testCases: { input: string; expectedOutput: string }[];
  points: number;
};

let connection: IORedis | undefined;
let queue: Queue<GradingJob> | undefined;

export const getBullConnection = () => {
  if (!connection) {
    connection = new IORedis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }
  return connection;
};

export const getGradingQueue = () => {
  if (!queue) {
    queue = new Queue<GradingJob>(GRADING_QUEUE, {
      connection: getBullConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { count: 2000 },
        removeOnFail: { count: 5000 },
      },
    });
  }
  return queue;
};

export const enqueueGrading = (job: GradingJob) =>
  getGradingQueue().add("grade", job, { jobId: `submission:${job.submissionId}` });
