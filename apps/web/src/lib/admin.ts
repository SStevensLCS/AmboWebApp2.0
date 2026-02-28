import { getSession } from "@/lib/session";
import { createAdminClient } from "@ambo/database/admin-client";

export async function requireAdmin() {
  const session = await getSession();
  const supabase = createAdminClient();

  if (!session || (session.role !== "admin" && session.role !== "superadmin")) {
    // We might want to allow superadmin here too?
    // Actually session.role comes from JWT. If I updated user role in DB, JWT might be stale until relogin.
    // However, for API routes, we often re-fetch user to be safe, or trust JWT.
    // If we trust JWT, we need to ensure "superadmin" is in the JWT role.
    // For now, let's return session/user info.
    return { authorized: false as const, supabase, user: null, role: null };
  }
  return { authorized: true as const, supabase, user: session, role: session.role };
}
