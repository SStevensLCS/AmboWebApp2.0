import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createAdminClient } from "@ambo/database/admin-client";

const TOKEN_KEY = "google_calendar_tokens";

function getOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/admin-mobile/callback`
    );
}

/**
 * GET /api/auth/google/admin-mobile/callback
 * Receives authorization code from Google, exchanges for tokens,
 * stores them in system_settings (org-wide admin calendar),
 * and redirects back to the mobile app via deep link.
 */
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");

    if (!code || state !== "admin") {
        return NextResponse.redirect("ambo://gcal-admin-callback?error=missing_params");
    }

    try {
        const client = getOAuth2Client();
        const { tokens } = await client.getToken(code);

        // Store in system_settings (org-wide admin calendar)
        const supabase = createAdminClient();
        await supabase.from("system_settings").upsert({
            key: TOKEN_KEY,
            value: tokens,
            updated_at: new Date().toISOString(),
        });

        console.log("[AdminMobileGCal] Tokens stored successfully");
        return NextResponse.redirect("ambo://gcal-admin-callback?success=true");
    } catch (err) {
        console.error("[AdminMobileGCal] Token exchange failed:", err);
        return NextResponse.redirect("ambo://gcal-admin-callback?error=auth_failed");
    }
}
