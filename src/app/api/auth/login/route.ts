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

    // 1. Authenticate with Supabase Auth
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error("Supabase Auth Error:", authError);
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 2. Fetch User Role from Public Table (using the auth user ID)
    // Use Admin Client to ensure we can read the profile regardless of RLS state in this request context
    const adminSupabase = createAdminClient();
    const { data: userProfile, error: profileError } = await adminSupabase
      .from("users")
      .select("id, role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !userProfile) {
      console.error("Profile Fetch Error:", profileError);
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 }
      );
    }

    // 3. Set Legacy 'ambo_session' Cookie (For Backward Compatibility)
    // The Supabase client automatically sets its own cookies via the 'cookies' helper in createClient.
    // We just need to ensure our custom session logic (which middleware checks) is also satisfied.
    await setSessionCookie({
      userId: userProfile.id,
      role: userProfile.role as "student" | "admin" | "superadmin",
    });

    const isStaff = ["admin", "superadmin"].includes(userProfile.role);
    const redirectTo = isStaff ? "/admin" : "/student";

    console.log("Login successful for user:", userProfile.id, "Redirecting to:", redirectTo);

    return NextResponse.json({ redirect: redirectTo });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
