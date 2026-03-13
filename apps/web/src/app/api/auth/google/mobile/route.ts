import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

function getOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error(
            "Google Calendar integration is not configured. " +
            "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables."
        );
    }
    return new google.auth.OAuth2(
        clientId,
        clientSecret,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/mobile/callback`
    );
}

/**
 * GET /api/auth/google/mobile?userId=...
 * Redirects to Google OAuth consent screen for mobile app users.
 * The userId is passed as state to be recovered in the callback.
 */
export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    try {
        const client = getOAuth2Client();
        const url = client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: SCOPES,
            state: userId,
        });

        return NextResponse.redirect(url);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Google Calendar is not configured." },
            { status: 500 }
        );
    }
}
