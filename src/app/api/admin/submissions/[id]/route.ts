import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, supabase } = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { data, error } = await supabase
    .from("submissions")
    .select(
      "id, user_id, service_date, service_type, credits, hours, feedback, status, created_at, users(first_name, last_name, email)"
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, supabase } = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.credits === "number") updates.credits = body.credits;
  if (typeof body.hours === "number") updates.hours = body.hours;
  if (["Pending", "Approved", "Denied"].includes(body.status))
    updates.status = body.status;
  if (typeof body.service_date === "string") updates.service_date = body.service_date;
  if (typeof body.service_type === "string") updates.service_type = body.service_type;
  if (typeof body.feedback === "string" || body.feedback === null)
    updates.feedback = body.feedback;

  const { error } = await supabase
    .from("submissions")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
