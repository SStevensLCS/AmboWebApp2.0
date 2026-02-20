import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const { authorized } = await requireAdmin();
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

  const supabase = createAdminClient();
  const role = body.role === "admin" ? "admin" : "student";

  // 1. Create Supabase Auth account with phone number as default password
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: String(email).trim(),
    password: phone10,
    email_confirm: true, // Skip email verification since admin is creating the account
  });

  if (authError) {
    console.error("Auth user creation failed:", authError);
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // 2. Insert into public users table using the auth user's ID
  const { error: profileError } = await supabase.from("users").insert({
    id: authData.user.id,
    first_name: String(first_name).trim(),
    last_name: String(last_name).trim(),
    phone: phone10,
    email: String(email).trim(),
    role,
  });

  if (profileError) {
    console.error("Profile insert failed:", profileError);
    // Clean up the auth user if profile insert fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
