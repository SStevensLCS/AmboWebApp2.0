import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import * as fs from "fs";
import * as path from "path";

// ─── Config ──────────────────────────────────────────────
const TOKEN_PATH = path.join(process.cwd(), "token.json");

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

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
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    return tokens;
}

export function isConnected(): boolean {
    return fs.existsSync(TOKEN_PATH);
}

function getAuthenticatedClient(): OAuth2Client {
    const client = getOAuth2Client();
    const raw = fs.readFileSync(TOKEN_PATH, "utf-8");
    const tokens = JSON.parse(raw);
    client.setCredentials(tokens);

    // Persist refreshed tokens automatically
    client.on("tokens", (newTokens) => {
        const merged = { ...tokens, ...newTokens };
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2));
    });

    return client;
}

function getCalendar(): calendar_v3.Calendar {
    return google.calendar({ version: "v3", auth: getAuthenticatedClient() });
}

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

export async function createCalendarEvent(
    event: AppEvent
): Promise<string | null> {
    if (!isConnected()) return null;

    try {
        const calendar = getCalendar();
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
    if (!isConnected()) return false;

    try {
        const calendar = getCalendar();
        await calendar.events.update({
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
    if (!isConnected()) return false;

    try {
        const calendar = getCalendar();
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
