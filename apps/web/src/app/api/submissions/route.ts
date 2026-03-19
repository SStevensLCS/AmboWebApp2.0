import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@ambo/database/admin-client";
import { submissionSchema, checkContentLength } from "@/lib/validations";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 20 requests per 15 minutes
  const rateLimitResult = await checkRateLimit(getRateLimitKey(req, "submissions"), {
    maxRequests: 20,
    windowSeconds: 900,
  });
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait before submitting again." },
      { status: 429 }
    );
  }

  // Payload size check
  const sizeError = checkContentLength(req);
  if (sizeError) {
    return NextResponse.json({ error: sizeError }, { status: 413 });
  }

  const body = await req.json();
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { user_id, service_date, service_type, credits, hours, feedback } = parsed.data;

  if (user_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("submissions").insert({
    user_id,
    service_date,
    service_type,
    credits,
    hours,
    feedback,
  });

  if (error) {
    return NextResponse.json({ error: "Request failed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
