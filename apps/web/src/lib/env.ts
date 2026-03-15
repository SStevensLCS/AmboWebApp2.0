import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
});

let validated = false;

/**
 * Validates required environment variables at runtime.
 * Call this in server-side code to fail fast with clear error messages.
 * Safe to call multiple times — only validates once.
 */
export function validateEnv() {
  if (validated) return;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.message).join(", ");
    throw new Error(`Environment variable validation failed: ${missing}`);
  }

  const hasSessionSecret = process.env.SESSION_SECRET || process.env.AUTH_SECRET;
  if (!hasSessionSecret) {
    throw new Error("Either SESSION_SECRET or AUTH_SECRET environment variable must be set");
  }

  validated = true;
}
