import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createAdminClient } from "@ambo/database/admin-client";

function getOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/mobile/callback`
    );
}

/**
 * GET /api/auth/google/mobile/callback
 * Receives authorization code from Google, exchanges for tokens,
 * stores them in the user's record, and redirects back to the mobile app
 * via the ambo:// deep link scheme.
 */
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    const userId = req.nextUrl.searchParams.get("state");

    if (!code || !userId) {
        return NextResponse.redirect("ambo://gcal-callback?error=missing_params");
    }

    try {
        const client = getOAuth2Client();
        const { tokens } = await client.getToken(code);

        const supabase = createAdminClient();
        const { error } = await supabase
            .from("users")
            .update({ calendar_tokens: tokens })
            .eq("id", userId);

        if (error) throw new Error("Failed to store calendar tokens");

        return NextResponse.redirect("ambo://gcal-callback?success=true");
    } catch (err) {
        console.error("[MobileGCal] Token exchange failed:", err);
        return NextResponse.redirect("ambo://gcal-callback?error=auth_failed");
    }
}
