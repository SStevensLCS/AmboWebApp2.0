import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCalendarEvent, syncEventToGoogle } from "@/lib/googleCalendar";

export async function POST(req: Request) {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "superadmin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Fetch all events
    // TODO: Pagination if many events? For now assume <1000 active events.
    const { data: events, error } = await supabase
        .from("events")
        .select("*");

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    let syncedCount = 0;
    let createdCount = 0;
    let errors = 0;

    // Process sequentially to avoid rate limits
    for (const event of events || []) {
        try {
            if (event.google_calendar_event_id) {
                // Update existing
                await syncEventToGoogle(event.id);
                syncedCount++;
            } else {
                // Create new
                // convert DB fields to AppEvent format if needed
                // actually createCalendarEvent takes AppEvent which matches DB schema mostly
                const newId = await createCalendarEvent({
                    title: event.title,
                    description: event.description,
                    start_time: event.start_time,
                    end_time: event.end_time,
                    location: event.location,
                    type: event.type,
                    uniform: event.uniform,
                });

                if (newId) {
                    await supabase
                        .from("events")
                        .update({ google_calendar_event_id: newId })
                        .eq("id", event.id);

                    // Sync RSVPs now that it's connected
                    await syncEventToGoogle(event.id);
                    createdCount++;
                } else {
                    errors++;
                }
            }
        } catch (e) {
            console.error(`Failed to sync event ${event.id}:`, e);
            errors++;
        }
    }

    return NextResponse.json({
        message: "Sync complete",
        stats: { synced: syncedCount, created: createdCount, errors }
    });
}
