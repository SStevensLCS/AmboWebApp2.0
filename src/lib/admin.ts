import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireAdmin() {
  const session = await getSession();
  const supabase = createAdminClient();

  if (!session || session.role !== "admin") {
    return { authorized: false as const, supabase };
  }
  return { authorized: true as const, supabase };
}
