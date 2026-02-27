import { NextRequest, NextResponse } from "next/server";
import { getSession, setSessionCookie, type SessionPayload } from "@/lib/session";
import { createAdminClient } from "@ambo/database/admin-client";

function roleHome(role: string): string {
  switch (role) {
    case "basic":
      return "/apply";
    case "applicant":
      return "/status";
    case "admin":
    case "superadmin":
      return "/admin";
    default:
      return "/student";
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (error || !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const actualRole = user.role as SessionPayload["role"];

  // Update the session cookie with the correct role
  await setSessionCookie({ userId: session.userId, role: actualRole });

  // Redirect to the correct home for the new role
  return NextResponse.redirect(new URL(roleHome(actualRole), request.url));
}
