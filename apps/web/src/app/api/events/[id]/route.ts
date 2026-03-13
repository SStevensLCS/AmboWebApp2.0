import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@ambo/database/admin-client";
import {
    updateCalendarEvent,
    deleteCalendarEvent,
} from "@/lib/googleCalendar";

/**
 * PUT /api/events/[id]
 * Update an event in the database and sync to Google Calendar.
 */
export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "superadmin")) {
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
        return NextResponse.json({ error: error.message }, { status: 400 });
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

    // ── Google Calendar sync ─────────────────────────────
    if (updated.google_calendar_event_id) {
        // Use sync helper to include RSVPs
        const { syncEventToGoogle } = await import("@/lib/googleCalendar");
        await syncEventToGoogle(updated.id);
    }

    return NextResponse.json({ event: updated });
}

/**
 * DELETE /api/events/[id]
 * Delete an event from the database and Google Calendar.
 */
export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "superadmin")) {
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
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // ── Google Calendar sync ─────────────────────────────
    if (event?.google_calendar_event_id) {
        await deleteCalendarEvent(event.google_calendar_event_id);
    }

    return NextResponse.json({ ok: true });
}
