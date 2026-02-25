import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email: emailOrPhone, password } = await req.json();

    if (!emailOrPhone || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
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
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }
      email = userByPhone.email;
    }

    const supabase = await createClient();

    // 1. Try email + password login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!authError && authData.user) {
      // Success — fetch role and set session cookie
      const adminSupabase = createAdminClient();
      const { data: userProfile, error: profileError } = await adminSupabase
        .from("users")
        .select("id, role")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !userProfile) {
        console.error("Profile fetch error:", profileError);
        return NextResponse.json(
          { error: "User profile not found." },
          { status: 404 }
        );
      }

      await setSessionCookie({
        userId: userProfile.id,
        role: userProfile.role as "student" | "admin" | "superadmin",
      });

      const isStaff = ["admin", "superadmin"].includes(userProfile.role);
      return NextResponse.json({ redirect: isStaff ? "/admin" : "/student" });
    }

    // 2. Auth failed — check if this is a known user who just hasn't set a password yet
    const adminSupabase = createAdminClient();
    const { data: existingUser } = await adminSupabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      // Valid user, no password set — send a reset email so they can create one
      const origin = req.headers.get("origin") || "http://localhost:3000";
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });
      return NextResponse.json({ needsPassword: true });
    }

    // Unknown user
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
