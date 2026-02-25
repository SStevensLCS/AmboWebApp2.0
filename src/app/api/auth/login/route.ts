import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { email: emailOrPhone } = await req.json();

    if (!emailOrPhone) {
      return NextResponse.json(
        { error: "Email or phone number is required." },
        { status: 400 }
      );
    }

    // If the identifier is a 10-digit phone number, look up the associated email
    let email = emailOrPhone;
    if (/^\d{10}$/.test(emailOrPhone)) {
      const adminSupabase = createAdminClient();
      const { data: userByPhone, error: phoneError } = await adminSupabase
        .from("users")
        .select("email")
        .eq("phone", emailOrPhone)
        .single();

      if (phoneError || !userByPhone?.email) {
        // Don't reveal whether the phone number exists
        return NextResponse.json({ ok: true });
      }
      email = userByPhone.email;
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const supabase = await createClient();

    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        shouldCreateUser: false, // only allow existing users to sign in
      },
    });

    // Always return ok — don't reveal whether the email exists
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
