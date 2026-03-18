import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@ambo/database/admin-client";
import { createClient } from "@supabase/supabase-js";
import {
    updateCalendarEvent,
    deleteCalendarEvent,
} from "@/lib/googleCalendar";

/**
 * Authenticate via cookie session (web) or Bearer token (mobile).
 * Returns { userId, role } or null.
 */
async function getAuthUser(req: NextRequest) {
    // Try cookie-based session first
    try {
        const session = await getSession();
        if (session) {
            return { userId: session.userId, role: session.role };
        }
    } catch {
        // cookies() may throw when no cookie context exists (mobile requests)
    }

    // Fallback: mobile bearer token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !supabaseServiceKey) return null;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;

    const adminClient = createAdminClient();
    const { data: dbUser } = await adminClient
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

    if (!dbUser) return null;
    return { userId: data.user.id, role: dbUser.role };
}

/**
 * PUT /api/events/[id]
 * Update an event in the database and sync to Google Calendar.
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const authUser = await getAuthUser(req);
    if (!authUser || (authUser.role !== "admin" && authUser.role !== "superadmin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, start_time, end_time, type, uniform } =
        body;

    const supabase = createAdminClient();

    // Update the database
    const { data: updated, error } = await supabase
        .from("events")
        .update({
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(start_time !== undefined && { start_time }),
            ...(end_time !== undefined && { end_time }),
            ...(type !== undefined && { type }),
            ...(uniform !== undefined && { uniform }),
        })
        .eq("id", params.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: "Request failed" }, { status: 400 });
    }

    // ── Update custom RSVP options if provided ────────────
    if (body.rsvp_options !== undefined) {
        // Delete existing options
        await supabase
            .from("event_rsvp_options")
            .delete()
            .eq("event_id", params.id);

        // Insert new options
        if (Array.isArray(body.rsvp_options) && body.rsvp_options.length > 0) {
            const optionRows = body.rsvp_options
                .filter((label: string) => label.trim())
                .map((label: string, idx: number) => ({
                    event_id: params.id,
                    label: label.trim(),
                    sort_order: idx,
                }));
            if (optionRows.length > 0) {
                await supabase.from("event_rsvp_options").insert(optionRows);
            }
        }
    }

    // ── Google Calendar sync (always attempt — syncEventToGoogle handles
    //    creating a new GCal event if one doesn't exist yet) ──────────
    try {
        const { syncEventToGoogle } = await import("@/lib/googleCalendar");
        await syncEventToGoogle(updated.id);
    } catch (err) {
        console.error("[Events PUT] GCal sync failed:", err);
    }

    return NextResponse.json({ event: updated });
}

/**
 * DELETE /api/events/[id]
 * Delete an event from the database and Google Calendar.
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const authUser = await getAuthUser(req);
    if (!authUser || (authUser.role !== "admin" && authUser.role !== "superadmin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Fetch event first to get gcal ID
    const { data: event } = await supabase
        .from("events")
        .select("google_calendar_event_id")
        .eq("id", params.id)
        .single();

    // Delete from database
    const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", params.id);

    if (error) {
        return NextResponse.json({ error: "Request failed" }, { status: 400 });
    }

    // ── Google Calendar sync ─────────────────────────────
    if (event?.google_calendar_event_id) {
        await deleteCalendarEvent(event.google_calendar_event_id);
    }

    return NextResponse.json({ ok: true });
}
