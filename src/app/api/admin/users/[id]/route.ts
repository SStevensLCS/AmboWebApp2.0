import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

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
  if (typeof body.first_name === "string") updates.first_name = body.first_name.trim();
  if (typeof body.last_name === "string") updates.last_name = body.last_name.trim();
  if (typeof body.email === "string") updates.email = body.email.trim();
  if (typeof body.phone === "string") {
    const phone10 = body.phone.replace(/\D/g, "");
    if (phone10.length === 10) updates.phone = phone10;
  }
  if (body.role === "admin" || body.role === "student") updates.role = body.role;

  const { error } = await supabase.from("users").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
