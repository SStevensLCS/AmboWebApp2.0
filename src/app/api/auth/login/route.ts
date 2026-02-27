import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSession, setSessionCookie } from "@/lib/session";
import bcrypt from "bcryptjs";

function redirectForRole(role: string): string {
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

export async function POST(req: NextRequest) {
  try {
    const { email: emailOrPhone, password } = await req.json();

    if (!emailOrPhone || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const identifier = emailOrPhone.trim().toLowerCase();

    // Look up user by email or 10-digit phone number
    let query = supabase.from("users").select("id, first_name, last_name, phone, email, role, password_hash, avatar_url");
    if (/^\d{10}$/.test(identifier)) {
      query = query.eq("phone", identifier);
    } else {
      query = query.eq("email", identifier);
    }

    const { data: user, error: lookupError } = await query.single();

    if (lookupError || !user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Verify password against stored hash
    if (!user.password_hash) {
      return NextResponse.json(
        { error: "No password set for this account. Please register or reset your password." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const sessionPayload = {
      userId: user.id,
      role: user.role as "basic" | "student" | "admin" | "superadmin" | "applicant",
    };

    // Set session cookie (web app)
    await setSessionCookie(sessionPayload);

    // Also return JWT token + user data in response body (mobile app)
    const token = await createSession(sessionPayload);

    return NextResponse.json({
      redirect: redirectForRole(user.role),
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
