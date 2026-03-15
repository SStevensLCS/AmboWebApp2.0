import { requireAdmin } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";
import { parsePagination, buildPaginatedResponse } from "@/lib/pagination";

export async function GET(req: NextRequest) {
  const { authorized, supabase } = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { page, limit, from, to } = parsePagination(
    new URL(req.url),
    { page: 1, limit: 50 }
  );

  const { data, error, count } = await supabase
    .from("submissions")
    .select(
      "id, user_id, service_date, service_type, credits, hours, feedback, status, created_at, users(first_name, last_name, email)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  return NextResponse.json(buildPaginatedResponse(data || [], count || 0, { page, limit, from, to }));
}
