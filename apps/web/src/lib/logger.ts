/**
 * Structured JSON logger for API routes.
 * Outputs structured logs that Vercel captures as queryable fields.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("submission.approved", { submissionId: "abc", actorId: "xyz" });
 *   logger.error("auth.failed", { email: "user@example.com", reason: "bad_password" });
 */

type LogLevel = "info" | "warn" | "error";

type LogEntry = {
  level: LogLevel;
  action: string;
  timestamp: string;
  [key: string]: unknown;
};

function log(level: LogLevel, action: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    action,
    timestamp: new Date().toISOString(),
    ...data,
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  info: (action: string, data?: Record<string, unknown>) => log("info", action, data),
  warn: (action: string, data?: Record<string, unknown>) => log("warn", action, data),
  error: (action: string, data?: Record<string, unknown>) => log("error", action, data),
};
