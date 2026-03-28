import { createAdminClient } from "@ambo/database/admin-client";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

/**
 * POST /api/mobile/change-password
 *
 * In-app password change: verifies the current password, then updates
 * both Supabase Auth and the bcrypt hash in public.users atomically.
 * No email confirmation required — the user proves identity with their
 * current password.
 */
export async function POST(req: NextRequest) {
  // Authenticate the caller
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body
  let body: { currentPassword: string; newPassword: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current password and new password are required." },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Fetch the current bcrypt hash to verify the old password
  const { data: userRow } = await admin
    .from("users")
    .select("password_hash")
    .eq("id", user.id)
    .single();

  if (!userRow?.password_hash) {
    return NextResponse.json(
      { error: "No password set for this account. Use the forgot password flow instead." },
      { status: 400 }
    );
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, userRow.password_hash);
  if (!isValid) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 403 }
    );
  }

  // Update Supabase Auth password
  const { error: authUpdateError } = await admin.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (authUpdateError) {
    console.error("[change-password] Auth update failed:", authUpdateError);
    return NextResponse.json(
      { error: "Failed to update password." },
      { status: 500 }
    );
  }

  // Update bcrypt hash in users table
  const newHash = await bcrypt.hash(newPassword, 12);
  const { error: dbError } = await admin
    .from("users")
    .update({ password_hash: newHash })
    .eq("id", user.id);

  if (dbError) {
    console.error("[change-password] DB update failed:", dbError);
    return NextResponse.json(
      { error: "Failed to update password." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
