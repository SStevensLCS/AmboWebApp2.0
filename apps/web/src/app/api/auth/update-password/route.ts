import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@ambo/database/admin-client";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Identify the user. Two paths:
    //   1. Normal path: ambo_session cookie set by /auth/callback (PKCE flow)
    //   2. Hash/implicit flow: callback was bypassed; use the Supabase session
    //      that AuthHashHandler established via supabase.auth.setSession()
    let userId: string | undefined;

    const appSession = await getSession();
    if (appSession) {
      userId = appSession.userId;
    } else {
      // Fall back to the Supabase session stored in cookies by @supabase/ssr
      const supabase = await createClient();
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      if (supabaseSession?.user?.email) {
        const { data: user } = await admin
          .from("users")
          .select("id")
          .eq("email", supabaseSession.user.email)
          .single();
        userId = user?.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { error } = await admin
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", userId);

    if (error) {
      console.error("Password hash update error:", error);
      return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update password error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
