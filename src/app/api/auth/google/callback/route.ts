import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { exchangeCodeForTokens } from "@/lib/googleCalendar";

/**
 * GET /api/auth/google/callback
 * Receives authorization code from Google, exchanges for tokens,
 * stores them, and redirects back to admin dashboard.
 */
export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== "admin") {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const code = req.nextUrl.searchParams.get("code");
    if (!code) {
        return NextResponse.redirect(
            new URL("/admin?error=missing_code", req.url)
        );
    }

    try {
        await exchangeCodeForTokens(code);
        return NextResponse.redirect(
            new URL("/admin?gcal=connected", req.url)
        );
    } catch (err) {
        console.error("[GCal] Token exchange failed:", err);
        return NextResponse.redirect(
            new URL("/admin?error=gcal_auth_failed", req.url)
        );
    }
}
