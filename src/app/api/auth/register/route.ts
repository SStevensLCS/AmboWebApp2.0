import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { setSessionCookie } from "@/lib/session";
import bcrypt from "bcryptjs";

const ALLOWED_DOMAINS = ["@student.linfield.com", "@linfield.com"];

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await req.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Validate email domain
    const emailLower = email.toLowerCase().trim();
    const domainValid = ALLOWED_DOMAINS.some((d) => emailLower.endsWith(d));
    if (!domainValid) {
      return NextResponse.json(
        { error: "Email must end in @student.linfield.com or @linfield.com." },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", emailLower)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password and insert user
    const passwordHash = await bcrypt.hash(password, 12);

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: emailLower,
        password_hash: passwordHash,
        role: "basic",
        phone: "0000000000", // placeholder — updated during application
      })
      .select("id, role")
      .single();

    if (insertError) {
      console.error("Registration insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      );
    }

    // Auto-login: set session cookie immediately
    await setSessionCookie({
      userId: newUser.id,
      role: "basic",
    });

    return NextResponse.json({ redirect: "/apply" });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
