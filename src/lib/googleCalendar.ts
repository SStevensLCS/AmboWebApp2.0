import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { createAdminClient } from "./supabase/admin";

// ─── Config ──────────────────────────────────────────────
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const TOKEN_KEY = "google_calendar_tokens";

function getOAuth2Client(): OAuth2Client {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
}

// ─── Auth helpers ────────────────────────────────────────
export function getAuthUrl(): string {
    const client = getOAuth2Client();
    return client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES,
    });
}

export async function exchangeCodeForTokens(code: string) {
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);

    // Store tokens in DB
    const supabase = createAdminClient();
    await supabase.from("system_settings").upsert({
        key: TOKEN_KEY,
        value: tokens,
        updated_at: new Date().toISOString(),
    });

    return tokens;
}

export async function isConnected(): Promise<boolean> {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", TOKEN_KEY)
        .single();

    return !!data?.value;
}

async function getAuthenticatedClient(): Promise<OAuth2Client> {
    const client = getOAuth2Client();
    const supabase = createAdminClient();

    const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", TOKEN_KEY)
        .single();

    if (!data?.value) {
        throw new Error("No tokens found");
    }

    const tokens = data.value;
    client.setCredentials(tokens);

    // Persist refreshed tokens automatically
    client.on("tokens", async (newTokens) => {
        const merged = { ...tokens, ...newTokens };
        await supabase.from("system_settings").upsert({
            key: TOKEN_KEY,
            value: merged,
            updated_at: new Date().toISOString(),
        });
    });

    return client;
}

async function getCalendar(): Promise<calendar_v3.Calendar> {
    const auth = await getAuthenticatedClient();
    return google.calendar({ version: "v3", auth });
}

// ─── Event mapping ───────────────────────────────────────
// ─── Event mapping ───────────────────────────────────────
type AppEvent = {
    id?: string;
    title: string;
    description?: string | null;
    start_time: string;
    end_time: string;
    location?: string | null;
    type?: string | null;
    uniform?: string | null;
    google_calendar_event_id?: string | null;
    rsvps?: {
        yes: string[];
        maybe: string[];
        no: string[];
    };
};

function buildGoogleEvent(
    event: AppEvent
): calendar_v3.Schema$Event {
    // Build a rich description with event type and uniform info
    let description = event.description || "";
    if (event.type) {
        description = `[${event.type}]\n${description}`;
    }
    if (event.uniform) {
        description += `\n\n👔 Uniform: ${event.uniform}`;
    }

    if (event.rsvps) {
        description += `\n\n📊 RSVPs:`;
        if (event.rsvps.yes.length > 0) {
            description += `\n✅ Yes (${event.rsvps.yes.length}): ${event.rsvps.yes.join(", ")}`;
        }
        if (event.rsvps.maybe.length > 0) {
            description += `\n❓ Maybe (${event.rsvps.maybe.length}): ${event.rsvps.maybe.join(", ")}`;
        }
        if (event.rsvps.no.length > 0) {
            description += `\n❌ No (${event.rsvps.no.length}): ${event.rsvps.no.join(", ")}`;
        }
        if (event.rsvps.yes.length === 0 && event.rsvps.maybe.length === 0 && event.rsvps.no.length === 0) {
            description += `\n(No RSVPs yet)`;
        }
    }

    return {
        summary: event.title,
        description: description.trim() || undefined,
        location: event.location || undefined,
        start: {
            dateTime: new Date(event.start_time).toISOString(),
            timeZone: "America/Los_Angeles",
        },
        end: {
            dateTime: new Date(event.end_time).toISOString(),
            timeZone: "America/Los_Angeles",
        },
    };
}

// ─── CRUD ────────────────────────────────────────────────
const calendarId = () => process.env.GOOGLE_CALENDAR_ID || "primary";

/**
 * Fetches the latest event data + RSVPs and syncs to Google Calendar.
 * Call this after any event update or RSVP change.
 */
export async function syncEventToGoogle(eventId: string) {
    // 1. Check connection
    if (!(await isConnected())) return;

    // 2. Fetch Event + RSVPs
    const supabase = createAdminClient();
    const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (eventError || !event || !event.google_calendar_event_id) {
        // No event or not synced yet
        return;
    }

    const { data: rsvps, error: rsvpError } = await supabase
        .from("event_rsvps")
        .select("status, users(first_name, last_name)")
        .eq("event_id", eventId);

    if (rsvpError) {
        console.error("[GCal] Failed to fetch RSVPs for sync:", rsvpError);
        return;
    }

    // 3. Format RSVPs
    const rsvpSummary = {
        yes: [] as string[],
        maybe: [] as string[],
        no: [] as string[],
    };

    rsvps?.forEach((row: any) => {
        const name = `${row.users?.first_name || ""} ${row.users?.last_name || ""}`.trim();
        if (row.status === "yes") rsvpSummary.yes.push(name);
        else if (row.status === "maybe") rsvpSummary.maybe.push(name);
        else if (row.status === "no") rsvpSummary.no.push(name);
    });

    // 4. Update Google Calendar
    try {
        await updateCalendarEvent(event.google_calendar_event_id, {
            ...event,
            rsvps: rsvpSummary,
        });
    } catch (err) {
        console.error("[GCal] Sync failed:", err);
    }
}

export async function createCalendarEvent(
    event: AppEvent
): Promise<string | null> {
    // Check connection first (async)
    if (!(await isConnected())) return null;

    try {
        const calendar = await getCalendar();
        const res = await calendar.events.insert({
            calendarId: calendarId(),
            requestBody: buildGoogleEvent(event),
        });
        return res.data.id || null;
    } catch (err) {
        console.error("[GCal] Failed to create event:", err);
        return null;
    }
}

export async function updateCalendarEvent(
    googleEventId: string,
    event: AppEvent
): Promise<boolean> {
    if (!(await isConnected())) return false;

    try {
        const calendar = await getCalendar();
        await calendar.events.patch({
            calendarId: calendarId(),
            eventId: googleEventId,
            requestBody: buildGoogleEvent(event),
        });
        return true;
    } catch (err) {
        console.error("[GCal] Failed to update event:", err);
        return false;
    }
}

export async function deleteCalendarEvent(
    googleEventId: string
): Promise<boolean> {
    if (!(await isConnected())) return false;

    try {
        const calendar = await getCalendar();
        await calendar.events.delete({
            calendarId: calendarId(),
            eventId: googleEventId,
        });
        return true;
    } catch (err) {
        console.error("[GCal] Failed to delete event:", err);
        return false;
    }
}
