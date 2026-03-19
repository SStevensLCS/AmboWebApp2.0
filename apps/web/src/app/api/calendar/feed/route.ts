import { NextResponse } from "next/server";
import { createAdminClient } from "@ambo/database/admin-client";

/**
 * GET /api/calendar/feed
 *
 * Public iCal feed of all AmboPortal events.
 * Users subscribe to this URL in Google Calendar, Apple Calendar, or Outlook.
 * Calendar apps poll this endpoint periodically to get updated event data.
 *
 * No authentication required — the feed is public so any ambassador can subscribe.
 */
export async function GET() {
    const supabase = createAdminClient();

    // Fetch events (future + last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .gte("end_time", thirtyDaysAgo)
        .order("start_time", { ascending: true });

    if (error) {
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }

    // Fetch all RSVPs with user names for these events
    const eventIds = (events || []).map((e) => e.id);
    let rsvpsByEvent: Record<string, { going: string[]; maybe: string[]; no: string[] }> = {};

    if (eventIds.length > 0) {
        const { data: rsvps } = await supabase
            .from("event_rsvps")
            .select("event_id, status, users!user_id(first_name, last_name)")
            .in("event_id", eventIds);

        if (rsvps) {
            for (const r of rsvps as any[]) {
                const eid = r.event_id;
                if (!rsvpsByEvent[eid]) {
                    rsvpsByEvent[eid] = { going: [], maybe: [], no: [] };
                }
                const name = `${r.users?.first_name || ""} ${r.users?.last_name || ""}`.trim();
                if (!name) continue;
                if (r.status === "going" || r.status === "yes") rsvpsByEvent[eid].going.push(name);
                else if (r.status === "maybe") rsvpsByEvent[eid].maybe.push(name);
                else if (r.status === "no") rsvpsByEvent[eid].no.push(name);
            }
        }
    }

    // Build iCalendar document (RFC 5545)
    const now = formatDateUTC(new Date());
    let ical = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//AmboPortal//Events//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:AmboPortal Events",
        "X-WR-TIMEZONE:America/Los_Angeles",
        "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
        "X-PUBLISHED-TTL:PT1H",
    ];

    for (const event of events || []) {
        const rsvp = rsvpsByEvent[event.id];

        // Build description with event metadata
        let desc = "";
        if (event.type) desc += `Type: ${event.type}\\n`;
        if (event.uniform) desc += `Uniform: ${event.uniform}\\n`;

        if (rsvp) {
            desc += "\\n--- RSVPs ---\\n";
            if (rsvp.going.length > 0) {
                desc += `Going (${rsvp.going.length}): ${rsvp.going.join(", ")}\\n`;
            }
            if (rsvp.maybe.length > 0) {
                desc += `Maybe (${rsvp.maybe.length}): ${rsvp.maybe.join(", ")}\\n`;
            }
            if (rsvp.no.length > 0) {
                desc += `Can't Go (${rsvp.no.length}): ${rsvp.no.join(", ")}\\n`;
            }
            if (rsvp.going.length === 0 && rsvp.maybe.length === 0 && rsvp.no.length === 0) {
                desc += "No RSVPs yet\\n";
            }
        }

        const vevent = [
            "BEGIN:VEVENT",
            `UID:${event.id}@ambo-portal`,
            `DTSTAMP:${now}`,
            `DTSTART:${formatDateUTC(new Date(event.start_time))}`,
            `DTEND:${formatDateUTC(new Date(event.end_time))}`,
            `SUMMARY:${escapeIcal(event.title)}`,
        ];

        if (desc) {
            vevent.push(`DESCRIPTION:${escapeIcal(desc)}`);
        }
        if (event.description) {
            // Use X-ALT-DESC for the original event description
            vevent.push(`X-ALT-DESC:${escapeIcal(event.description)}`);
        }

        vevent.push(
            `LAST-MODIFIED:${formatDateUTC(new Date(event.created_at || event.start_time))}`,
            "END:VEVENT"
        );

        ical.push(...vevent);
    }

    ical.push("END:VCALENDAR");

    return new Response(ical.join("\r\n"), {
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": 'inline; filename="ambo-events.ics"',
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    });
}

/** Format a Date as iCal UTC timestamp: 20260318T140000Z */
function formatDateUTC(d: Date): string {
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escape special characters for iCal text values */
function escapeIcal(text: string): string {
    return text
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n");
}
