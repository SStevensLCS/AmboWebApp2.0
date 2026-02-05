import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const { authorized, supabase } = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, phone, email, role")
    .order("last_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { authorized, supabase } = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { first_name, last_name, phone, email } = body;
  if (!first_name || !last_name || !phone || !email) {
    return NextResponse.json(
      { error: "Missing first_name, last_name, phone, or email" },
      { status: 400 }
    );
  }

  const phone10 = phone.replace(/\D/g, "");
  if (phone10.length !== 10) {
    return NextResponse.json(
      { error: "Phone must be 10 digits" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("users").insert({
    first_name: String(first_name).trim(),
    last_name: String(last_name).trim(),
    phone: phone10,
    email: String(email).trim(),
    role: body.role === "admin" ? "admin" : "student",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
