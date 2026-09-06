import httpStatus from "http-status";
import config from "../config";
import ApiError from "../shared/ApiError";
import logger from "../shared/logger";

type TestCase = { input: string; expectedOutput: string };
type Judge0Result = { passed: boolean; output?: string };

const CONCURRENCY = Number(process.env.JUDGE0_CONCURRENCY) || 4;
const TIMEOUT_MS = Number(process.env.JUDGE0_TIMEOUT_MS) || 15_000;

const runOne = async (code: string, languageId: number, testCase: TestCase): Promise<Judge0Result> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(
      `${config.judge0.apiUrl}/submissions?base64_encoded=false&wait=true`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: testCase.input,
          expected_output: testCase.expectedOutput,
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      logger.warn({ status: response.status }, "judge0_non_ok_response");
      return { passed: false };
    }

    const result = (await response.json()) as { status?: { id: number }; stdout?: string };
    return { passed: result.status?.id === 3, output: result.stdout ?? undefined };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      logger.warn({ languageId }, "judge0_timeout");
      return { passed: false };
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

const runTestCases = async (
  code: string,
  languageId: number,
  testCases: TestCase[]
): Promise<Judge0Result[]> => {
  if (!config.judge0.apiUrl) {
    throw new ApiError(httpStatus.NOT_IMPLEMENTED, "Code execution is not configured — set JUDGE0_API_URL");
  }

  const results: Judge0Result[] = new Array(testCases.length);
  let idx = 0;

  const worker = async (): Promise<void> => {
    while (true) {
      const i = idx++;
      if (i >= testCases.length) break;
      results[i] = await runOne(code, languageId, testCases[i]!);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, testCases.length) }, () => worker())
  );

  return results;
};

export const Judge0Client = { runTestCases };
