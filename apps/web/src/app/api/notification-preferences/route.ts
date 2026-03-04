import { getSession } from "@/lib/session";
import { createAdminClient } from "@ambo/database/admin-client";
import { NextResponse } from "next/server";

const DEFAULTS = {
    chat_messages: true,
    new_posts: true,
    post_comments: true,
    events: true,
    event_comments: true,
};

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Upsert default row if it doesn't exist
    const { data, error } = await supabase
        .from("notification_preferences")
        .upsert(
            { user_id: session.userId, ...DEFAULTS },
            { onConflict: "user_id", ignoreDuplicates: true }
        )
        .select()
        .single();

    if (error) {
        // Upsert with ignoreDuplicates may not return data; try a select
        const { data: existing, error: selectError } = await supabase
            .from("notification_preferences")
            .select("*")
            .eq("user_id", session.userId)
            .single();

        if (selectError || !existing) {
            return NextResponse.json({ error: "Failed to load preferences" }, { status: 500 });
        }
        return NextResponse.json({ preferences: existing });
    }

    return NextResponse.json({ preferences: data });
}

export async function PUT(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const supabase = createAdminClient();

    // Only allow known preference keys
    const allowed = ["chat_messages", "new_posts", "post_comments", "events", "event_comments"];
    const updates: Record<string, boolean> = {};
    for (const key of allowed) {
        if (typeof body[key] === "boolean") {
            updates[key] = body[key];
        }
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No valid preferences provided" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("notification_preferences")
        .upsert(
            { user_id: session.userId, ...updates, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
        )
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ preferences: data });
}
