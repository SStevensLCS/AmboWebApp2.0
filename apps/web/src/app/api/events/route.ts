import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@ambo/database/admin-client";
import { createCalendarEvent } from "@/lib/googleCalendar";
import { eventSchema, checkContentLength } from "@/lib/validations";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("events")
        .select("*, users!created_by(role)")
        .order("start_time", { ascending: true });

    if (error) {
        return NextResponse.json({ error: "Request failed" }, { status: 400 });
    }
    return NextResponse.json({ events: data || [] });
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "superadmin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Payload size check
    const sizeError = checkContentLength(req);
    if (sizeError) {
        return NextResponse.json({ error: sizeError }, { status: 413 });
    }

    const body = await req.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0].message },
            { status: 400 }
        );
    }

    const { title, description, start_time, end_time, location, type, uniform, rsvp_options } = parsed.data;

    const eventData = {
        title,
        description: description || null,
        start_time,
        end_time,
        location: location || null,
        type: type || "Event",
        created_by: session.userId,
        uniform: uniform || "Ambassador Polo with Navy Pants.",
    };

    const supabase = createAdminClient();
    const { data: newEvent, error } = await supabase
        .from("events")
        .insert(eventData)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: "Request failed" }, { status: 400 });
    }

    // ── Insert custom RSVP options if provided ────────────
    if (rsvp_options && rsvp_options.length > 0) {
        const optionRows = rsvp_options
            .filter((label: string) => label.trim())
            .map((label: string, idx: number) => ({
                event_id: newEvent.id,
                label: label.trim(),
                sort_order: idx,
            }));
        if (optionRows.length > 0) {
            await supabase.from("event_rsvp_options").insert(optionRows);
        }
    }

    // ── Google Calendar sync ─────────────────────────────
    const gcalId = await createCalendarEvent({
        ...eventData,
        id: newEvent.id,
    });

    if (gcalId) {
        await supabase
            .from("events")
            .update({ google_calendar_event_id: gcalId })
            .eq("id", newEvent.id);
    }

    return NextResponse.json({ ok: true, event: newEvent });
}
