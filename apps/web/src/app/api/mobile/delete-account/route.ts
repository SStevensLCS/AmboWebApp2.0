import { createAdminClient } from "@ambo/database/admin-client";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * Verify a Supabase Bearer token from the mobile app.
 * Returns the authenticated user's ID or null.
 */
async function getAuthenticatedUserId(
  req: NextRequest
): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user.id;
}

/**
 * DELETE /api/mobile/delete-account
 *
 * Permanently deletes the authenticated user's account and all associated data.
 * The database uses ON DELETE CASCADE, so removing the user row cascades to:
 * - submissions, event_rsvps, event_comments, posts, comments,
 *   chat_messages, chat_participants, push_subscriptions, expo_push_tokens, etc.
 *
 * After deleting DB data, the Supabase Auth user is also removed.
 */
export async function DELETE(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 1. Delete the user row from the public.users table (cascades to related data)
  const { error: deleteError } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (deleteError) {
    console.error("[delete-account] Failed to delete user row:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete account data" },
      { status: 500 }
    );
  }

  // 2. Delete the Supabase Auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("[delete-account] Failed to delete auth user:", authError);
    // Data is already gone — still report success to the client
  }

  // 3. Clean up any storage objects (avatars) — best effort
  try {
    const { data: avatarFiles } = await supabase.storage
      .from("avatars")
      .list(userId);
    if (avatarFiles && avatarFiles.length > 0) {
      const paths = avatarFiles.map((f) => `${userId}/${f.name}`);
      await supabase.storage.from("avatars").remove(paths);
    }
  } catch {
    // Non-critical — don't fail the request
  }

  return NextResponse.json({ success: true });
}
