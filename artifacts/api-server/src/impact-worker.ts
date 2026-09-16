import { logger } from "./lib/logger";
import { runImpactSync } from "./lib/sync";
import { pool } from "@workspace/db";

try {
  const result = await runImpactSync();
  logger.info({ enabled: result.enabled, message: result.message }, "Impact sync worker finished");
  if (result.error) process.exitCode = 1;
} finally {
  await pool.end();
}