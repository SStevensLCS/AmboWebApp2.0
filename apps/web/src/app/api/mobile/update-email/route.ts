import { createAdminClient } from "@ambo/database/admin-client";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/mobile/update-email
 *
 * Atomically updates the user's email in both Supabase Auth and the
 * public.users table. Uses the admin client to bypass RLS and the Auth
 * confirmation flow (which doesn't work well from a mobile app context).
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

  // Parse and validate the new email
  let body: { email: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const newEmail = body.email?.trim().toLowerCase();
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 }
    );
  }

  if (newEmail === user.email) {
    return NextResponse.json({ updated: false, message: "Email unchanged" });
  }

  const admin = createAdminClient();

  // Check that no other user already has this email
  const { data: conflict } = await admin
    .from("users")
    .select("id")
    .eq("email", newEmail)
    .neq("id", user.id)
    .maybeSingle();

  if (conflict) {
    return NextResponse.json(
      { error: "This email is already in use by another account." },
      { status: 409 }
    );
  }

  // Update Auth email (admin API skips confirmation)
  const { error: authUpdateError } = await admin.auth.admin.updateUserById(
    user.id,
    { email: newEmail, email_confirm: true }
  );

  if (authUpdateError) {
    console.error("[update-email] Auth update failed:", authUpdateError);
    return NextResponse.json(
      { error: "Failed to update email" },
      { status: 500 }
    );
  }

  // Update users table
  const { error: dbError } = await admin
    .from("users")
    .update({ email: newEmail })
    .eq("id", user.id);

  if (dbError) {
    console.error("[update-email] DB update failed:", dbError);
    // Try to roll back the Auth email to avoid drift
    await admin.auth.admin.updateUserById(user.id, {
      email: user.email!,
      email_confirm: true,
    });
    return NextResponse.json(
      { error: "Failed to update email" },
      { status: 500 }
    );
  }

  console.log(
    `[update-email] Updated email for ${user.id}: ${user.email} → ${newEmail}`
  );
  return NextResponse.json({ updated: true, email: newEmail });
}
