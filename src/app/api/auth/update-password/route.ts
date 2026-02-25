import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", session.userId);

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
