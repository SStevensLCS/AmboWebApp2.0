import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@ambo/database/admin-client";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

function getOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error("Google Calendar integration is not configured.");
    }
    return new google.auth.OAuth2(
        clientId,
        clientSecret,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/admin-mobile/callback`
    );
}

/**
 * GET /api/auth/google/admin-mobile?token=...
 * Initiates the admin-level Google Calendar OAuth flow from the mobile app.
 * Uses a Bearer token to verify the user is an admin/superadmin.
 * Stores tokens in system_settings (org-wide), not per-user.
 */
export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
        return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Verify the user is admin/superadmin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: dbUser } = await adminClient
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

    if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "superadmin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const client = getOAuth2Client();
        const url = client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: SCOPES,
            state: "admin", // identifies this as admin flow in callback
        });
        return NextResponse.redirect(url);
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Google Calendar is not configured." },
            { status: 500 }
        );
    }
}
