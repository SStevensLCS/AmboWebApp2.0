import { createAdminClient } from "@ambo/database/admin-client";

// Prevent Next.js from trying to statically prerender this route at build time
export const dynamic = "force-dynamic";

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
        return new Response("Failed to fetch events", { status: 500 });
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
    const icalLines: string[] = [
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

        // Build compact single-line description using · separators
        // (Google Calendar renders \n as literal text in subscribed feeds,
        //  and Apple Calendar shows HTML tags as raw text — so a clean
        //  single-line format is the only cross-platform solution)
        const parts: string[] = [];

        if (event.type) parts.push(event.type);
        if (event.uniform) parts.push(`Uniform: ${event.uniform}`);

        if (rsvp) {
            if (rsvp.going.length > 0) {
                parts.push(`Going (${rsvp.going.length}): ${rsvp.going.join(", ")}`);
            }
            if (rsvp.maybe.length > 0) {
                parts.push(`Maybe (${rsvp.maybe.length}): ${rsvp.maybe.join(", ")}`);
            }
            if (rsvp.no.length > 0) {
                parts.push(`Can't Go (${rsvp.no.length}): ${rsvp.no.join(", ")}`);
            }
        }

        let desc = parts.join(" · ");
        if (event.description) {
            desc = desc ? `${event.description} — ${desc}` : event.description;
        }

        const vevent: string[] = [
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

        vevent.push(
            `LAST-MODIFIED:${formatDateUTC(new Date(event.created_at || event.start_time))}`,
            "END:VEVENT"
        );

        icalLines.push(...vevent);
    }

    icalLines.push("END:VCALENDAR");

    // Use line folding per RFC 5545: lines > 75 octets should be folded
    const folded = icalLines.map(foldLine).join("\r\n");

    return new Response(folded, {
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

/** Escape special characters for iCal text values (RFC 5545 §3.3.11) */
function escapeIcal(text: string): string {
    return text
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n");
}

/**
 * Fold long lines per RFC 5545 §3.1:
 * Lines longer than 75 octets should be folded with CRLF + space.
 */
function foldLine(line: string): string {
    if (line.length <= 75) return line;
    const chunks: string[] = [];
    chunks.push(line.substring(0, 75));
    let i = 75;
    while (i < line.length) {
        chunks.push(" " + line.substring(i, i + 74));
        i += 74;
    }
    return chunks.join("\r\n");
}
