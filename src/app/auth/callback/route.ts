import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { setSessionCookie } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || null;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session?.user) {
      const userId = data.session.user.id;

      // Look up the user's role from the public users table
      const adminSupabase = createAdminClient();
      const { data: userProfile } = await adminSupabase
        .from("users")
        .select("id, role")
        .eq("id", userId)
        .single();

      if (userProfile) {
        await setSessionCookie({
          userId: userProfile.id,
          role: userProfile.role as "student" | "admin" | "superadmin",
        });

        const isStaff = ["admin", "superadmin"].includes(userProfile.role);
        const redirectTo = next || (isStaff ? "/admin" : "/student");
        return NextResponse.redirect(new URL(redirectTo, req.url));
      }
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=invalid_link", req.url)
  );
}
