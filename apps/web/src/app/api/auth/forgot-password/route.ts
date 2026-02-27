import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@ambo/database/admin-client";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const emailLower = email.toLowerCase().trim();

    // Only send reset emails for users that actually exist in our system
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", emailLower)
      .single();

    if (!existingUser) {
      // Don't reveal whether the email exists
      return NextResponse.json({ ok: true });
    }

    // Ensure the user exists in Supabase Auth (needed for email delivery).
    // Users registered before the dual-auth fix won't have an auth record yet.
    await supabase.auth.admin.createUser({
      id: existingUser.id,
      email: existingUser.email,
      email_confirm: true,
      password: randomBytes(32).toString("hex"), // Temporary — immediately reset
    });
    // Ignore errors — the most common case is the user already exists, which is fine.

    // Prefer an explicit env var so production deployments always use the
    // correct URL. NEXT_PUBLIC_SITE_URL must be set in Vercel (and in
    // Supabase's Redirect URL allowlist) for the link to work in production.
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    // Redirect to the site root — the root page (page.tsx) already handles
    // both PKCE codes (?code=) and implicit-flow hash fragments
    // (#access_token=...&type=recovery), forwarding the user to /reset-password.
    // Using just the origin avoids Supabase redirect-allowlist issues that occur
    // when the redirectTo contains query parameters like ?next=/reset-password.
    const { error } = await supabase.auth.resetPasswordForEmail(existingUser.email, {
      redirectTo: origin,
    });

    if (error) {
      console.error("Password reset error:", error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
