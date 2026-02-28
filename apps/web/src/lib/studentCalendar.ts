import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { createAdminClient } from "@ambo/database/admin-client";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

function getOAuth2Client(): OAuth2Client {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/student/callback`
    );
}

export function getStudentAuthUrl(userId: string): string {
    const client = getOAuth2Client();
    return client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES,
        state: userId,
    });
}

export async function exchangeStudentCode(code: string, userId: string) {
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);

    const supabase = createAdminClient();
    const { error } = await supabase
        .from("users")
        .update({ calendar_tokens: tokens })
        .eq("id", userId);

    if (error) throw new Error("Failed to store calendar tokens");
    return tokens;
}

export async function isStudentConnected(userId: string): Promise<boolean> {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("users")
        .select("calendar_tokens")
        .eq("id", userId)
        .single();

    return !!data?.calendar_tokens;
}

export async function disconnectStudentCalendar(userId: string) {
    const supabase = createAdminClient();
    await supabase
        .from("users")
        .update({ calendar_tokens: null })
        .eq("id", userId);
}
