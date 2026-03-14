import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { createAdminClient } from "@ambo/database/admin-client";
import { type AppEvent, buildGoogleEvent } from "@/lib/googleCalendar";

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

// ─── Per-user calendar sync ─────────────────────────────

async function getUserCalendar(
    userId: string
): Promise<calendar_v3.Calendar | null> {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("users")
        .select("calendar_tokens")
        .eq("id", userId)
        .single();

    if (!data?.calendar_tokens) return null;

    const client = getOAuth2Client();
    const tokens = data.calendar_tokens as Record<string, unknown>;
    client.setCredentials(tokens);

    // Persist refreshed tokens
    client.on("tokens", async (newTokens) => {
        const merged = { ...tokens, ...newTokens };
        await supabase
            .from("users")
            .update({ calendar_tokens: merged })
            .eq("id", userId);
    });

    return google.calendar({ version: "v3", auth: client });
}

/**
 * Sync an event to a single user's personal Google Calendar.
 */
async function syncEventToUserCalendar(
    userId: string,
    event: AppEvent
): Promise<void> {
    try {
        const calendar = await getUserCalendar(userId);
        if (!calendar) return;

        await calendar.events.insert({
            calendarId: "primary",
            requestBody: buildGoogleEvent(event),
        });
    } catch (err) {
        console.error(
            `[GCal] Failed to sync event to user ${userId}:`,
            err
        );
    }
}

/**
 * Sync an event to ALL users who have connected their Google Calendar.
 */
export async function syncEventToAllUsers(event: AppEvent): Promise<void> {
    const supabase = createAdminClient();
    const { data: users } = await supabase
        .from("users")
        .select("id")
        .not("calendar_tokens", "is", null);

    if (!users || users.length === 0) return;

    await Promise.allSettled(
        users.map((u) => syncEventToUserCalendar(u.id, event))
    );
}
