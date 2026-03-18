import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@ambo/database/admin-client";
import { createClient } from "@supabase/supabase-js";
import { sendNotificationToUser } from "@/lib/notifications";

/**
 * Verify a Supabase Bearer token from the mobile app.
 * Returns the user's role and ID, or null.
 */
async function getMobileUser(
    req: NextRequest
): Promise<{ id: string; role: string } | null> {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.slice(7);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !supabaseServiceKey) return null;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;

    // Fetch role from users table
    const adminClient = createAdminClient();
    const { data: dbUser } = await adminClient
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

    if (!dbUser) return null;
    return { id: data.user.id, role: dbUser.role };
}

/**
 * POST /api/events/[id]/send-reminder
 * Admin/superadmin endpoint: sends a reminder notification to all going/maybe RSVPs.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // Try cookie session first (web), then bearer token (mobile)
    let userId: string | null = null;
    let userRole: string | null = null;

    try {
        const session = await getSession();
        if (session) {
            userId = session.userId;
            userRole = session.role;
        }
    } catch {
        // cookies() may throw when no cookie context exists (mobile requests)
    }

    if (!userId) {
        const mobileUser = await getMobileUser(req);
        if (mobileUser) {
            userId = mobileUser.id;
            userRole = mobileUser.role;
        }
    }

    if (!userId || (userRole !== "admin" && userRole !== "superadmin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const eventId = params.id;

    // Get event details
    const { data: event, error: eventError } = await supabase
        .from("events")
        .select("id, title, start_time")
        .eq("id", eventId)
        .single();

    if (eventError || !event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get RSVPs with going or maybe status
    const { data: rsvps } = await supabase
        .from("event_rsvps")
        .select("user_id")
        .eq("event_id", eventId)
        .in("status", ["going", "maybe"]);

    if (!rsvps || rsvps.length === 0) {
        return NextResponse.json({ ok: true, sent: 0, message: "No going/maybe RSVPs" });
    }

    const userIds = rsvps.map((r) => r.user_id);

    // Check notification preferences
    const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("user_id, event_reminders")
        .in("user_id", userIds);

    const optedOut = new Set<string>();
    prefs?.forEach((p) => {
        if (p.event_reminders === false) optedOut.add(p.user_id);
    });

    const eventDate = new Date(event.start_time);
    const timeStr = eventDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Los_Angeles",
    });
    const dateStr = eventDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "America/Los_Angeles",
    });

    let sent = 0;
    for (const uid of userIds) {
        if (optedOut.has(uid)) continue;

        try {
            await sendNotificationToUser(uid, {
                title: "Event Reminder",
                body: `"${event.title}" — ${dateStr} at ${timeStr}`,
                url: `/student/events`,
                mobilePath: `/(student)/events/${event.id}`,
            });
            sent++;
        } catch (err) {
            console.error(`[SendReminder] Failed for user ${uid}:`, err);
        }
    }

    return NextResponse.json({ ok: true, sent });
}
