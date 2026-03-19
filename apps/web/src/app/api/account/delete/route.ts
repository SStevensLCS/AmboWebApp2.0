import { NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/session";
import { createAdminClient } from "@ambo/database/admin-client";

/**
 * DELETE /api/account/delete
 *
 * Permanently deletes the authenticated web user's account and all associated data.
 * Uses session cookie for auth (web flow) vs Bearer token (mobile flow at /api/mobile/delete-account).
 */
export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = session;
  const supabase = createAdminClient();

  // 1. Delete the user row (cascades to submissions, posts, comments, chat, rsvps, etc.)
  const { error: deleteError } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (deleteError) {
    console.error("[delete-account] Failed to delete user row:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }

  // 2. Delete the Supabase Auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("[delete-account] Failed to delete auth user:", authError);
  }

  // 3. Clean up avatar storage — best effort
  try {
    const { data: avatarFiles } = await supabase.storage
      .from("avatars")
      .list(userId);
    if (avatarFiles && avatarFiles.length > 0) {
      const paths = avatarFiles.map((f) => `${userId}/${f.name}`);
      await supabase.storage.from("avatars").remove(paths);
    }
  } catch {
    // Non-critical
  }

  // 4. Clear the session cookie
  await clearSessionCookie();

  return NextResponse.json({ success: true });
}
