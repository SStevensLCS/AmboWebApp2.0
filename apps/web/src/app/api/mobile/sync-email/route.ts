import { createAdminClient } from "@ambo/database/admin-client";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/mobile/sync-email
 *
 * Ensures users.email matches the Supabase Auth email for the authenticated
 * user. Called by the mobile app on sign-in to repair any email drift caused
 * by the Auth confirmation flow (users.email was updated optimistically while
 * Auth required email confirmation to actually change).
 *
 * Uses the admin client to bypass RLS, since the UPDATE policy on users
 * requires is_admin_user() — which itself looks up by email and will fail
 * when the emails are already out of sync (chicken-and-egg).
 */
export async function POST(req: NextRequest) {
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

  // Verify the caller's Supabase Auth session
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use admin client (bypasses RLS) to sync the email
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("users")
    .select("email")
    .eq("id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (existing.email === user.email) {
    return NextResponse.json({ synced: false, message: "Already in sync" });
  }

  const { error: updateError } = await admin
    .from("users")
    .update({ email: user.email })
    .eq("id", user.id);

  if (updateError) {
    console.error("[sync-email] Update failed:", updateError);
    return NextResponse.json(
      { error: "Failed to sync email" },
      { status: 500 }
    );
  }

  console.log(
    `[sync-email] Synced users.email for ${user.id}: ${existing.email} → ${user.email}`
  );
  return NextResponse.json({ synced: true, email: user.email });
}
