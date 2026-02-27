import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, phone, email, role, avatar_url")
    .eq("id", session.userId)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
