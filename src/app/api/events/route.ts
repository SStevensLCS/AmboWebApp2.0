import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCalendarEvent } from "@/lib/googleCalendar";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ events: data || [] });
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session || session.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, start_time, end_time, location, type } = body;

    if (!title || !start_time || !end_time) {
        return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
        );
    }

    const eventData = {
        title,
        description: description || null,
        start_time,
        end_time,
        location: location || "TBD",
        type: type || "Event",
        created_by: session.userId,
        uniform: body.uniform || "Ambassador Polo with Navy Pants.",
    };

    const supabase = createAdminClient();
    const { data: newEvent, error } = await supabase
        .from("events")
        .insert(eventData)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
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

