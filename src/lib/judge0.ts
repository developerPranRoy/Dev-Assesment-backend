import httpStatus from "http-status";
import config from "../config";
import ApiError from "../shared/ApiError";

type TestCase = { input: string; expectedOutput: string };
type Judge0Result = { passed: boolean; output?: string };

/**
 * Delegates execution to a self-hosted or public Judge0 instance rather
 * than running untrusted code in this process. Requires JUDGE0_API_URL —
 * throws NOT_IMPLEMENTED until that's configured.
 */
const runTestCases = async (
  code: string,
  languageId: number,
  testCases: TestCase[]
): Promise<Judge0Result[]> => {
  if (!config.judge0.apiUrl) {
    throw new ApiError(
      httpStatus.NOT_IMPLEMENTED,
      "Code execution is not configured — set JUDGE0_API_URL"
    );
  }

  const results: Judge0Result[] = [];

  for (const testCase of testCases) {
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
      }
    );

    const result = (await response.json()) as { status?: { id: number }; stdout?: string };
    results.push({
      passed: result.status?.id === 3, // Judge0 status 3 = "Accepted"
      output: result.stdout,
    });
  }

  return results;
};

export const Judge0Client = { runTestCases };
