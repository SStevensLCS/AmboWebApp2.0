import { NextResponse } from "next/server";
import { createAdminClient } from "@ambo/database/admin-client";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};
  let healthy = true;

  // Database connectivity check
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true });
    checks.database = error ? "error" : "ok";
    if (error) healthy = false;
  } catch {
    checks.database = "error";
    healthy = false;
  }

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
